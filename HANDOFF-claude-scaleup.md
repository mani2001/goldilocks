# Handoff: Receipts scale-up — for Claude Code

**Date:** 2026-11-15 · **From:** Vyomi (Muse) · **For:** Claude Code (on Mani's Mac / home server)
**Status:** FINAL — Day 1 batch results in (see below).

## What Receipts is

A small fine-tuned model that reads AI/tech launch news and returns a structured,
evidence-cited verdict: **signal or slop**. Story in; claims table (each claim
confirmed / self_reported / contradicted / unverifiable, with evidence IDs),
prior art, novelty 1–5, slop 1–5 (= hype gap), one-line tldr with the marketing
removed. The product exists because judging "is this launch real, new, and worth
my attention?" currently has to be done by hand, every time, over a firehose
designed to fool it.

Working name: **Receipts**. Generic — NOT Tavily-branded; web search (Tavily) is
the evidence layer, swappable.

## Where things live

- **Source of truth (sandbox + VPS):** `~/workspace/decision-model/` on the Muse
  sandbox; mirrored runtime copy at `/root/receipts/` on the VPS
  (Hostinger `srv1923036`, tailnet `100.104.184.116`, user `root`).
- **Key files:**
  - `FINAL-SPEC.md` — the full design (world/personal split, pipeline, ship plan)
  - `LOCKED.md` — what's frozen for Day 1 labelling, and why
  - `rubric.md` v1.1 — the rubric (the product; the model is its delivery mechanism)
  - `schema.json` + `validate.py` — verdict schema and validator
  - `pipeline-prompts.md` v1 (LOCKED) — Pass A + Pass B prompts
  - `hypebench-seed.md` — 20 known-outcome launches with expected reads (the eval set)
  - `baseline/` — `run_baseline.py` v3, inputs, stories, `results/BASELINE-v1..v4.md`
  - `labelling/` — `label.py` (the Day 1 pipeline), batch inputs, stories, results
  - `smoke-test/` — two hand-run verdicts (DeepSeek R1, Humane AI Pin)
  - `proposal.md` — one-page plain-language proposal for friends
- **SSH to the VPS** (from the sandbox; outbound goes through an HTTP egress proxy):
  tunnel proxy = HTTPS_PROXY with port changed to 3130; `ssh -i ~/.ssh/id_ed25519
  -o ProxyCommand="python3 ~/workspace/hermes/ssh_via_proxy.py %h %p" root@100.104.184.116`.
  Idle sessions die ~300s — run long jobs detached (`nohup … & disown`, log to a file).
  The public-IP route (2.25.115.132) is broken; use the tailnet IP.
- **This repo (Mac):** `~/Desktop/receipts/` on Mani's Mac, git remote
  `git@github.com:mani2001/receipts.git` (public). This is the copy Claude Code
  works in — the sync is already done. Commit and push work as you go.
- **SSH to the VPS from the Mac:** direct over Tailscale, no proxy needed:
  `ssh root@100.104.184.116` (the Mac's key is in the VPS authorized_keys,
  verified 2026-11-15). The sandbox route below is Vyomi's only.

## Keys (VPS only — never copy to the Mac or the sandbox)

- **Token Factory (Nebius serverless inference):** `/root/.nebius_token_factory_key`
  (mode 600, root-only). API: `https://api.tokenfactory.nebius.com/v1/chat/completions`
  (OpenAI-compatible). Teacher model: `Qwen/Qwen3-235B-A22B-Instruct-2507`
  ($0.20 in / $0.60 out per 1M tokens). Small-model proxy:
  `Qwen/Qwen3-30B-A3B-Instruct-2507` ($0.10/$0.30). **No Qwen3-8B dense on
  Token Factory** — the fine-tune target (Qwen3-8B) is trained on RunPod, not here.
- **Tavily (evidence search):** in `/root/.hermes/profiles/ila/.env`
  (`TAVILY_API_KEY=…`, 57 chars). Search: `POST https://api.tavily.com/search`
  (basic depth, `max_results` 3); extract: `POST https://api.tavily.com/extract`.
  Verified live from the VPS 2026-11-15.
- **RunPod:** Mani still needs to create/fund the account ($20 suggested) — NOT
  done yet. Training runs on a RunPod RTX 4090 pod (~$0.34/hr Community).
- If Claude Code needs the keys, Mani provides them — do NOT ask Vyomi to print
  them, and do NOT move them to the Mac without Mani's say-so.

## The pipeline (locked for Day 1)

Pass A (model: claims + queries + prior-art candidates) → deterministic fetch
(code: Tavily search + registry verifiers; every evidence item carries a
**snippet** — a short summary of what the source says) → Pass B (model: verdict
judging claims against the snippets) → deterministic normalizer (strips stray
fields the model copies from input) → `validate.py` (schema + key order +
evidence-id refs + independence rule). Only validated examples enter the dataset.

**Why snippets are mandatory:** the URL-only baseline (v2) showed both models
judging blind — they could not confirm pricing or name prior art they had never
seen the contents of. Snippets fixed it (v3).

## What Day 0 proved (baselines, all on the same 2 stories + same evidence)

| Run | R1 (hand 5/2) | Pin (hand 3/4) | Validation |
|---|---|---|---|
| v1 small Qwen prompted | 3/4 | 4/3 | fails |
| v2 235B, URL-only | 3/4 | **3/4** | passes |
| v3 235B + snippets | 3/4 | 3/4 | fails (snippet copying) |
| v4 235B + snippets + fixed prompts | **5/2** | 4/3 | passes |

Conclusions: fine-tune justified (prompting a small model doesn't do this);
235B is a credible lean teacher once it can see the evidence. **Do NOT keep
tuning prompts against these two stories** — that was a rabbit hole, closed by
Mani on 2026-11-15. Judge quality on the first 100 labelled examples and the
full 20-story seed instead.

Known open items (fix only if they show up across the first 100 examples):
prior-art candidates must be products, not benchmarks; slop weighted by claim
kind; per-category undisclosed guide.

## Day 1 status

- [x] Prompts/rubric/runner locked (`LOCKED.md`)
- [x] `label.py` built: offline mode (pre-fetched day-0 evidence, for seed stories)
      + live mode (Tavily fetch, for current launches); normalizer + validation
      built in; validated examples appended to `dataset.jsonl`
- [x] Batch 1 (offline, Rabbit R1 + Devin, scored vs seed expected reads) — DONE
- [x] Live-fetch proof (3 current launches: Muse Ember, Claude Fable/Mythos 5.2,
      GPT-6 Sol/Luna) — DONE

### Batch 1 results (2026-11-15; full report: `labelling/DAY1-BATCH1.md`)
- Rabbit R1: teacher novelty 3 / slop 3 vs hand 3/4. Devin: teacher 4/3 vs hand
  4/4. Novelty exact on both fresh stories; slop one point generous on both —
  the kind-weighting pattern (confirmed commercial facts offsetting unproven
  capability claims), now confirmed on three slop cases. No retune per the lock;
  first item for the first-100 review.
- Normalizer v3.1: drops claims with non-enum kinds (Devin emitted a `funding`
  claim for the Series A). Pipeline fix, not a prompt change.
- Ops: SSH pipe breaks ~300s — run long jobs detached (`nohup … & disown`).

### Live-fetch proof results (2026-11-15)
- 3/3 valid: Muse Ember 4/2, Claude Fable/Mythos 5.2 3/3, GPT-6 Sol/Luna 3/3.
  Pricing confirmed via independent trackers; benchmark claims correctly
  self_reported. Cost ~$0.008 inference + ~30 Tavily searches.
- One independence miss: Meta's own Facebook post marked independent — the
  domain check doesn't catch company social accounts. Fix in the scale-up.

## The scale-up — what Claude Code owns

1. **Finish the seed eval:** hand-label (or teacher-label + human-check) the
   remaining 16 HypeBench seed stories with day-0 evidence; score the teacher
   against the seed's expected reads. This is the quality gate.
2. **Label the first 100:** live mode on 100 recent launch stories; review quality;
   decide lean teacher (235B) vs premium frontier teacher. Budget: lean path
   ~$50–75 all-in for the whole project; teacher labelling is the real cost.
3. **Scale to 3,000–5,000 world-verdict examples** incl. an adversarial set
   (injected instructions, syndication farms, disclosure theatre, waitlist-as-launch).
   Tavily volume ~32k searches — likely covered by Mani's existing plan.
4. **Train (Day 2):** QLoRA/Unsloth fine-tune of Qwen3-8B on a RunPod 4090 pod;
   eval on HypeBench (post-cutoff test split only).
5. **Ship (Day 3):** HF weights + dataset + model card, live demo Space, plugin
   (browser-extension badge + MCP server `check_launch`/`whats_new`), launch posts
   led by the underhyped detector.
6. **Registry verifiers** (not yet built): HF Hub / GitHub / PyPI / pricing-page /
   leaderboard checks in the fetch step. The labelling pipeline currently uses
   Tavily search content only.

## Standing rules (Mani's own — do not break)

- Isolation: never use Mani's logins/credentials from a machine that isn't
  authorised for them; project processes run isolated on the VPS, not on his Mac.
  The Mac work (Nov 14) was his explicit instruction for that task only.
- Build minimal: smallest thing that works; never build a work product from a
  passing mention — only on explicit request.
- Unattended Claude Code runs: prefer restricted safer mode over
  `--dangerously-skip-permissions`.
- Free learning materials only when recommending resources.
- AI-drafted outgoing messages: sound human, no double dashes / em-dashes.
