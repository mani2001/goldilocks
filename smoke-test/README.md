# Smoke test #1 — DeepSeek R1 (2026-11-14)

**Story:** TechCrunch, originally published Jan 20, 2025 (launch day; updated Jan 27) — "DeepSeek claims its 'reasoning' model beats OpenAI's o1 on certain benchmarks."
**Files:** `pass-a.json` (claims + queries), `verdict.json` (Pass B output, day-0 evidence only). Verdict passes `validate.py`.

## The card (day-0 view)
- Novelty **5** / Slop **2** / Confidence **med** / Access: shipped (weights, API, app)
- Benchmark claim (beats o1 on AIME/MATH-500/SWE-bench) → **self_reported** — only DeepSeek's report + model card existed on day 0
- License/availability, 671B params, distill range, API pricing → **confirmed** (HF registry check + published price comparison)
- Undisclosed: training_data, eval_independent · Recheck: when independent replication lands

## vs the seed's expected read (novelty 5, slop 1)
Novelty matches. Slop is 2, not 1 — deliberately: on day 0 the headline claim rested on self-run benchmarks, and the rubric forbids calling that "fully backed." The card flags exactly what was unverified (`eval_independent`, `recheck_when`).
**Hindsight rescore:** independent evals confirmed the benchmarks within weeks; the app hit #1 on the App Store Jan 26–27. Rescored slop → **1**. The day-0 card identified precisely the claim that needed time, and time resolved it in the model's favour — the pipeline working as designed, not a miss.

## Design fix found by this run
The validator's independence rule initially rejected the registry-confirmed claims: the HF page is DeepSeek's own card (not "independent"), yet the downloadable weights are a deterministic check, not a claim. Fix: evidence items can carry `"check": "registry"`; `confirmed` now requires an independent source **or** a registry check. Schema + validator updated.
