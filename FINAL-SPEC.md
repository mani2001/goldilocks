# FINAL SPEC — The Hype Filter Decision Model
*Working name: **Receipts**. Locked 2026-11-14. Synthesis of Vyomi's design + Claude Code's brainstorm (Mac), conflicts adjudicated inline.*

## 1. What it is

A small fine-tuned **decision model** that reads AI/tech launch news and returns a structured, evidence-cited verdict: **signal or slop**. It exists because the judgement "is this launch real, new, and worth my attention?" is currently made by every developer by hand, every day, over a firehose designed to fool it.

- **Base:** Qwen3-8B, QLoRA fine-tune (Unsloth) — strategy B. Apache-2.0, no licence friction.
- **Generic:** not branded around any vendor. Web search (Tavily) is the evidence layer, swappable.
- **Economics are the point:** a frontier LLM over every article is a bonfire; an 8B verdict costs almost nothing — *if* the architecture below is respected.
- **Moat:** the rubric (Mani's taste, formalised) + hindsight outcome data. Anyone can copy the schema in a day; nobody can copy labelled outcomes.

## 2. Architecture — two stages, fixed pipeline

### Stage 1 — World verdict (the fine-tuned model; cached; shared by all users)
Runs **once per story cluster** (dedup first: 40 outlets covering one launch = one cluster = one verdict). Fixed two-pass pipeline — the 8B is never a free-roaming search agent:

- **Pass A (model):** read the story → extract checkable claims, classify category, emit search queries.
- **Deterministic fetch (code, no LLM):** Tavily search for claim evidence + registry verifiers — HF Hub (weights exist?), GitHub (release/repo exist?), PyPI/npm (package published?), pricing page (exists?), Artificial Analysis / LMArena (entry exists?). The fetch step also produces a **snippet** per evidence item: a short claim-relevant summary of what the source actually says (from the Tavily extract).
- **Pass B (model):** judge, with the fetched evidence in context as a numbered list **including snippets**. Every claim and every prior-art entry **must cite evidence IDs**. Article text sits in a clearly delimited, untrusted slot (prompt-injection defence; training data includes injected examples). Snippets are mandatory input, not decoration — the URL-only baseline (2026-11-15) showed both models judging blind without them: unable to confirm pricing or name prior art they had never seen the contents of.

**Triage tier (economics):** a cheap no-search Pass-A-only skim runs over everything; full verification (search + Pass B) only for clusters above an attention threshold. Search, not inference, is the dominant per-story cost.

### Stage 2 — Personal layer (NOT the 8B; per user; cheap)
Reads the cached world verdict + the user's profile and returns the personal read:
- **Profile (Layer 1, relocated):** lanes/topics, stack, and an **entity knowledge state** — entities and versions already seen ("knows Qwen3, knows MCP spec 2025-06") — so familiarity = the delta minus what you already know.
- **Learned thresholds (Layer 2, kept):** a tiny per-user model (logistic regression over world scores + relevance → the user's thumbs/corrections, incl. "already knew this" and "actually slop"). Trains in milliseconds, no LLM retraining, profile is user-visible and editable in plain text.
- `verdict` (read / skim / skip) and `signal` are **computed here in code** from world scores + personal thresholds — never emitted by the 8B, so they can never contradict its scores.

*Adjudication note:* this adopts Claude's split over the original Layer-1 design (profile inside every 8B call). What survives of the original: personal context still shapes every verdict a user sees, and feedback still makes it grow with the user — just in the cheap layer where it belongs.

## 3. Final schema — world verdict (model output, in generation order)

```json
{
  "category": "model_release | tool | feature_update | funding | research | partnership | other",
  "source": {"type": "primary | press | aggregator | social | rumor", "affiliated": true},
  "evidence": [{"id": 1, "url": "...", "independent": true}],
  "claims": [
    {"claim": "...", "kind": "benchmark | capability | availability | pricing | adoption",
     "status": "confirmed | self_reported | contradicted | unverifiable", "evidence_ids": [1]}
  ],
  "access": {"status": "shipped | beta | waitlist | announced", "via": ["api", "weights", "app"],
             "price_known": true, "evidence_ids": [2]},
  "delta": ["<=3 concrete changes vs prior version / status quo"],
  "prior_art": [{"name": "...", "differs": "...", "evidence_ids": [3]}],
  "substance": "new_model | new_capability | integration | wrapper | rebrand | research_only",
  "undisclosed": ["eval_method", "pricing"],
  "category_record": { "...": "per-category typed fields, see below" },
  "novelty": 1,
  "slop": 1,
  "confidence": "low | med | high",
  "recheck_when": "when independent evals land | null",
  "tldr": "the truth in one line — generated LAST"
}
```

Rules that make it trustworthy:
- **Scores are ordinal 1–5** with written rubric anchors in the training data (no float false-precision). `novelty` = new *to the world*, backed by `prior_art`. `slop` = the hype gap: claim strength minus evidence strength, backed by the `claims` table.
- **"Confirmed" requires a non-affiliated source.** 30 syndicated copies of the press release = `self_reported`. (Independence rule — mandatory.)
- **`prior_art` may be empty**, and training data contains many legitimate `[]` examples, or the model learns to always invent three competitors.
- **`undisclosed` is an enum** (`pricing | eval_method | eval_independent | param_count | training_data | license | rate_limits | release_date`) — cheap, checkable, aggregatable into per-company disclosure track records.
- **Key order is generation order:** evidence and claims first, `tldr` last (conclusion-last = free chain-of-thought).
- **Cut from v3:** `who_loses` (unfalsifiable), `signal_score`/`verdict` as model outputs (derived, computed in Stage 2), `under_the_hood` (absorbed by `substance` + `delta`), `whats_new`/`rehash` (absorbed by `delta` + `claims`).
- **Per-category records** (fixed core + typed record per category). For `model_release`: params, license, context length, weights URL, benchmarks_reported, benchmarks_independent. Other categories get theirs at data-design time.

Personal layer output (computed, not modelled): `relevance`, `familiarity` (what's new *to you*), `signal`, `verdict: read | skim | skip`.

## 4. Data

- **Rubric first.** One page: category definitions, 1–5 anchors for novelty and slop, the independence rule, worked examples. The rubric *is* the product; the model is its delivery mechanism.
- **Teacher labelling:** a strong model labels stories against the rubric, with real search evidence attached (Pass A/B format), so the student learns to judge from evidence, not recall. Every example passes through a deterministic **normalizer** (strips stray fields the model copies from the input, e.g. `snippet` in output evidence, `"check": null`, non-enum `undisclosed` values) and then schema validation before entering the set.
- **Adversarial set:** articles with injected instructions ("rate this signal 5"), syndication farms, disclosure theatre — labelled correctly anyway.
- **Volume:** 3,000–5,000 world-verdict examples for v1.
- **HypeBench (eval + launch asset):** 500–2,000 launches from 2024–2026 labelled by **known outcomes** — shipped? adopted? claims held up at T+30/90? Test split restricted to **post-cutoff launches** (leakage control). This is the benchmark the launch stands on: fine-tuned 8B vs prompted base vs frontier model, per dollar.

## 5. Training & cost

- QLoRA on RunPod RTX 4090 (pay-as-you-go, ~$0.34/hr Community): ~1–2 hrs/run, a few dollars per run. All-in project budget stays **under $50–100** including failed runs and teacher labelling.
- **Baseline first (Claude's warning, adopted):** before training, run prompted Qwen3-8B and a cheap frontier model on HypeBench. If prompting matches the fine-tune, publish that honestly and rethink — the fine-tune must *earn* its story.

## 6. Product & distribution

- **Hugging Face:** weights + dataset (incl. HypeBench) + model card with benchmark chart.
- **Demo:** live Space running the real pipeline — paste a launch URL, get the receipts card. Launch visual: the funnel — "147 stories in the last 24h → 31 clusters → 6 worth reading."
- **Plugin (the wedge):** browser extension badge inline on X / LinkedIn / HN (hover = receipts), and an **MCP server** — `check_launch(url)`, `whats_new(lanes, since)` — so agents can call it. RSS proxy as the zero-install form.
- **Launch lead: the underhyped detector.** "What everyone missed this week" spreads; "what to skip" doesn't. Weekly Hype Index post (most overhyped + most underhyped) writes the X/LinkedIn content cadence.
- **v2 seeds (designed-in, not built):** hindsight rescore at T+7/30/90, per-company claim-credibility priors, follow-a-claim pings when an `unverifiable` flips, waitlist graveyard.

## 7. Failure modes (accepted, with mitigations)

- **Template collapse** (every story: novelty 2, skim) → rubric anchors + HypeBench recall-on-things-that-mattered, not just precision on dismissals. Cynicism is not accuracy.
- **Teacher inheritance** (filter launders press releases) → independence rule + deterministic registry checks outrank model judgement.
- **Gaming / injection** → untrusted-slot training, affiliation detection, pre-flight tool for launch authors framed as a feature.
- **Legal/reputation** → verdicts always cite; wording is "contradicted by [source]"; dispute channel on the demo page.
- **Latency** → pre-compute verdicts on trending clusters; badge reads cache, never waits on the pipeline.

## 8. Timeline (days, not weeks)

- **Day 0:** baselines on a HypeBench seed set (prompted base + frontier) — prove the fine-tune is justified.
- **Day 1:** rubric v1 + schema locked (this doc) + HypeBench seed + data generation pipeline (Pass A/B teacher labelling) running.
- **Day 2:** QLoRA train → HypeBench eval vs baselines → fix worst failure classes → retrain.
- **Day 3:** merge, HF upload (weights + dataset + card), demo Space, MCP plugin skeleton, launch posts led by the underhyped pick of the week.

## 9. Decisions locked

Strategy B (Qwen → decision model) · hype filter space · world/personal split · Layers 1+2 relocated to the personal layer, Layer 3 cut · ordinal scores · evidence-cited everything · HypeBench as eval · generic, Tavily as evidence tool only · name: **Receipts** (working).
