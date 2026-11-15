#!/usr/bin/env python3
"""Receipts Day 1 labelling pipeline — runs on the VPS, where both keys live.

Teacher: Qwen/Qwen3-235B-A22B-Instruct-2507 on Token Factory, using the LOCKED
prompts from run_baseline.py v3 (see LOCKED.md). Every verdict passes through
the deterministic normalizer and validate.py before entering the dataset.

Modes:
  offline: inputs carry pre-fetched evidence (with snippets). Used for the
    HypeBench seed stories, where evidence must be day-0 only — live search
    would leak hindsight into the verdict.
  live: inputs carry only the story. Pass A queries go to Tavily (basic
    search); results become evidence, snippets taken from the search content.

Usage:
  python3 label.py offline batch1-inputs.json [outdir]
  python3 label.py live live-inputs.json [outdir]

Outputs per story: <id>-pass-a.json, <id>-verdict.json (raw + parsed),
<id>-verdict-only.json, plus dataset.jsonl (validated examples only) and a
run summary printed at the end.
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "baseline"))

from run_baseline import (  # noqa: E402
    PASS_A_TEMPLATE,
    PASS_B_TEMPLATE,
    call_chat,
    extract_json,
    format_evidence,
    normalize_verdict,
)
from validate import check as validate_file  # noqa: E402

TEACHER_MODEL = "Qwen/Qwen3-235B-A22B-Instruct-2507"
TAVILY_URL = "https://api.tavily.com/search"
TAVILY_ENV = "/root/.hermes/profiles/ila/.env"
TOKEN_FACTORY_KEY_FILE = "/root/.nebius_token_factory_key"
MAX_EVIDENCE = 8
SNIPPET_CHARS = 600

# Domains that carry the company's own release, not independent coverage.
PR_WIRES = {
    "prnewswire.com", "www.prnewswire.com",
    "businesswire.com", "www.businesswire.com",
    "globenewswire.com", "www.globenewswire.com",
    "prnewswire.co.uk", "www.prnewswire.co.uk",
}


def load_tavily_key():
    for line in open(TAVILY_ENV):
        if line.startswith("TAVILY_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError(f"TAVILY_API_KEY not found in {TAVILY_ENV}")


def domain_of(url):
    try:
        return urllib.parse.urlparse(url).netloc.lower()
    except Exception:  # noqa: BLE001
        return ""


def tavily_search(api_key, query, max_results=3):
    body = json.dumps({
        "api_key": api_key,
        "query": query,
        "search_depth": "basic",
        "max_results": max_results,
    }).encode()
    req = urllib.request.Request(
        TAVILY_URL, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.load(resp)


def fetch_evidence(tavily_key, item, pass_a):
    """Run Pass A queries through Tavily; build the evidence list with snippets."""
    company_domains = {d.lower() for d in item.get("company_domains", [])}
    evidence = []
    seen_urls = set()

    def add(url, independent, snippet, check=None):
        if url in seen_urls or len(evidence) >= MAX_EVIDENCE:
            return
        seen_urls.add(url)
        e = {"id": len(evidence) + 1, "independent": independent, "url": url}
        if check:
            e["check"] = check
        if snippet:
            e["snippet"] = snippet[:SNIPPET_CHARS]
        evidence.append(e)

    # The story's own article is evidence 1 (as in the smoke tests).
    if item.get("story_url"):
        add(item["story_url"], not item.get("source_affiliated", False),
            item["story"][:SNIPPET_CHARS])

    queries = []
    for c in pass_a.get("claims", []):
        queries.extend(c.get("queries", [])[:2])
    queries.extend(pass_a.get("prior_art_queries", [])[:3])
    # Dedup, keep order, cap the search count per story.
    seen_q = set()
    queries = [q for q in queries if not (q in seen_q or seen_q.add(q))][:10]

    for q in queries:
        if len(evidence) >= MAX_EVIDENCE:
            break
        try:
            data = tavily_search(tavily_key, q)
        except Exception as e:  # noqa: BLE001
            print(f"    tavily search failed for {q!r}: {e}", flush=True)
            continue
        for r in data.get("results", []):
            url = r.get("url", "")
            dom = domain_of(url)
            independent = dom not in company_domains and dom not in PR_WIRES
            add(url, independent, r.get("content", ""))
        time.sleep(0.5)
    return evidence


def label_story(api_key, tavily_key, item, mode):
    """Run one story through Pass A (+ fetch) -> Pass B -> normalize."""
    sid = item["id"]
    print(f"== {sid} ==", flush=True)
    raw_a, u = call_chat(api_key, TEACHER_MODEL,
                          PASS_A_TEMPLATE.format(story=item["story"]))
    usage = {"prompt_tokens": u.get("prompt_tokens", 0),
             "completion_tokens": u.get("completion_tokens", 0)}
    try:
        pass_a = extract_json(raw_a)
    except Exception as e:  # noqa: BLE001
        pass_a = {"_parse_error": str(e), "_raw": raw_a}
    print(f"  pass A done ({len(str(pass_a))} chars)", flush=True)
    time.sleep(1)

    if mode == "live":
        evidence = fetch_evidence(tavily_key, item, pass_a)
        print(f"  fetch done ({len(evidence)} evidence items)", flush=True)
    else:
        evidence = item["evidence"]

    raw_b, u = call_chat(api_key, TEACHER_MODEL, PASS_B_TEMPLATE.format(
        story=item["story"],
        pass_a=json.dumps(pass_a, indent=2),
        evidence=format_evidence(evidence),
    ))
    usage["prompt_tokens"] += u.get("prompt_tokens", 0)
    usage["completion_tokens"] += u.get("completion_tokens", 0)
    try:
        verdict = extract_json(raw_b)
        verdict, fixes = normalize_verdict(verdict)
        if fixes:
            print(f"  normalizer: {'; '.join(fixes)}", flush=True)
    except Exception as e:  # noqa: BLE001
        verdict = {"_parse_error": str(e), "_raw": raw_b}
    print(f"  pass B done — novelty={verdict.get('novelty')} "
          f"slop={verdict.get('slop')}", flush=True)
    time.sleep(1)
    return pass_a, raw_a, verdict, raw_b, evidence, usage


def main():
    if len(sys.argv) < 3 or sys.argv[1] not in ("offline", "live"):
        sys.exit(__doc__)
    mode, inputs_path = sys.argv[1], sys.argv[2]
    outdir = sys.argv[3] if len(sys.argv) > 3 else os.path.join(
        HERE, "results", os.path.splitext(os.path.basename(inputs_path))[0])
    os.makedirs(outdir, exist_ok=True)

    api_key = open(TOKEN_FACTORY_KEY_FILE).read().strip()
    tavily_key = load_tavily_key() if mode == "live" else None
    inputs = json.load(open(inputs_path))

    total_usage = {"prompt_tokens": 0, "completion_tokens": 0}
    n_valid, n_total = 0, 0
    dataset_path = os.path.join(outdir, "dataset.jsonl")
    with open(dataset_path, "w") as ds:
        for item in inputs:
            sid = item["id"]
            pass_a, raw_a, verdict, raw_b, evidence, usage = label_story(
                api_key, tavily_key, item, mode)
            total_usage["prompt_tokens"] += usage["prompt_tokens"]
            total_usage["completion_tokens"] += usage["completion_tokens"]
            n_total += 1
            json.dump({"raw": raw_a, "parsed": pass_a},
                      open(os.path.join(outdir, f"{sid}-pass-a.json"), "w"),
                      indent=2)
            json.dump({"raw": raw_b, "parsed": verdict},
                      open(os.path.join(outdir, f"{sid}-verdict.json"), "w"),
                      indent=2)
            verdict_only_path = os.path.join(outdir, f"{sid}-verdict-only.json")
            json.dump(verdict, open(verdict_only_path, "w"), indent=2)
            errors = validate_file(verdict_only_path)
            if errors:
                print(f"  INVALID: {'; '.join(errors)}", flush=True)
            else:
                n_valid += 1
                ds.write(json.dumps({
                    "id": sid,
                    "story": item["story"],
                    "pass_a": pass_a,
                    "evidence": evidence,
                    "verdict": verdict,
                }) + "\n")

    print(f"\nTOTAL TOKENS: {total_usage}")
    print(f"VALID: {n_valid}/{n_total} — dataset at {dataset_path}")
    print(f"RESULTS IN: {outdir}")


if __name__ == "__main__":
    main()
