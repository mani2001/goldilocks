# Day 1 — Batch 1 + live-fetch proof (2026-11-15)

Teacher: Qwen3-235B-A22B, locked prompts (pipeline-prompts v1, rubric v1.1),
runner v3 + normalizer v3.1. All runs on the VPS; Tavily key from Ila's .env,
Token Factory key root-only.

## Batch 1 — offline, two fresh seed stories (day-0 evidence, hand-fetched)

| Story | Hand (seed) | Teacher | Validation |
|---|---|---|---|
| Rabbit R1 | novelty 3, slop 4 | novelty 3, slop 3 | passes |
| Devin | novelty 4, slop 4 | novelty 4, slop 3 | passes after normalizer fix |

- **Novelty exact on both fresh stories.** Categories right (both `tool`),
  prior art right (Humane Pin for Rabbit; GitHub Copilot for Devin), access
  right (Rabbit announced/device; Devin waitlist), claims tables essentially
  right (capability/benchmark claims correctly self_reported).
- **Slop one point generous on both** — the same kind-weighting pattern seen
  on the Pin in v4: confirmed commercial/availability facts (ship dates,
  early-access status) offset unproven capability claims. Now confirmed on
  three slop cases (Pin, Rabbit, Devin), not two-story overfitting. Per the
  lock, no retune now — this is first on the list for the first-100 review.
- **Normalizer v3.1 (pipeline fix, not a prompt change):** Devin's verdict
  initially failed validation — the model emitted a claim with kind `funding`
  (the $21M Series A). The normalizer now drops claims whose kind is outside
  the enum (funding is not a checkable product claim). Devin re-validated and
  entered the dataset. Runner updated on the VPS; local copy updated too.
- **Ops note:** the first batch run died mid-Devin when the SSH pipe broke
  (~300s idle limit). Rabbit's outputs survived (written per story). Devin
  rerun detached (`nohup … & disown`) completed fine. Long jobs run detached
  from now on.
- Dataset: `labelling/results/batch1-inputs/dataset.jsonl` — 2 validated
  examples. Cost: ~$0.002 inference.

## Live-fetch proof — 3 current launches, full pipeline

Stories found via Tavily news search (week of Nov 9–13, 2026), texts via
Tavily extract, evidence via live Tavily search from Pass A queries.

| Story | Teacher | Validation |
|---|---|---|
| Muse Ember (Meta, TechCrunch) | novelty 4, slop 2, conf high | passes |
| Claude Fable/Mythos 5.2 (Anthropic) | novelty 3, slop 3, conf med | passes |
| GPT-6 Sol/Luna (OpenAI) | novelty 3, slop 3, conf med | passes |

- **3/3 valid, sensible verdicts.** Pricing confirmed via independent trackers
  (OpenRouter, pricing blogs); benchmark claims correctly self_reported on the
  two primary-source stories; Ember's "cheaper and smarter" claim confirmed via
  Artificial Analysis (independent). Prior art good across all three.
- **One independence miss:** Meta's own Facebook post (`facebook.com/AIatMeta`)
  was marked independent — the domain check doesn't catch a company's own
  social account. Fix for the scale-up: affiliated if the domain is a company
  domain OR a known company social handle; better, check the page's author
  against the company.
- Cost: 19,403 prompt + 6,256 completion tokens ≈ $0.008 inference, plus
  ~30 Tavily searches. Dataset: `labelling/results/live-inputs/dataset.jsonl`
  — 3 validated examples.

## Day 1 verdict

The labelling pipeline works end to end in both modes. The teacher matches
hand novelty on fresh stories and runs one point generous on slop in slop
cases — a known, recorded pattern for the first-100 review, not a blocker.
Total Day 1 inference spend so far: under $0.02. The scale-up (first 100,
then 3,000–5,000) is handed to Claude Code per Mani's 2026-11-15 decision;
see `HANDOFF-claude-scaleup.md`.
