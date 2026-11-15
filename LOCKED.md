# LOCKED — Day 1 labelling baseline (2026-11-15)

The baseline iteration is closed. These versions are frozen for Day 1 teacher
labelling. Any change needs a version bump and a dated note — no silent edits,
no tuning against the two smoke-test stories.

| Artifact | Locked version |
|---|---|
| Rubric | `rubric.md` v1.1 (prior-art definition, score calibration, category guidance) |
| Pipeline prompts | `pipeline-prompts.md` v1 (Pass A with prior-art candidates, Pass B with snippets + calibration + output-field discipline) |
| Runner | `baseline/run_baseline.py` v3 + normalizer v3.1 (2026-11-15: drops claims with non-enum kinds — pipeline fix, not a prompt change) |
| Schema | `schema.json` (as of 2026-11-15, incl. `device` in access.via) |
| Validator | `validate.py` |

Baseline record: v1 (small model, backwards + invalid) → v2 (235B URL-only,
Pin exact, R1 blind) → v3 (snippets fixed evidence use) → v4 (R1 exact 5/2,
Pin 4/3 vs hand 3/4, validation passes). Reports in
`baseline/results/BASELINE-v1.md` … `BASELINE-v4.md`.

Known open items (NOT to be fixed by re-tuning on the two smoke-test stories —
they get fixed only if they show up across the first 100 labelled examples):
- Prior-art candidates must be products/companies, never benchmarks or datasets.
- Slop weighted by claim kind (capability/benchmark claims carry it).
- Per-category undisclosed guide (kitchen sink on hardware).

Day 1 labelling uses the locked prompts with the 235B teacher and real Tavily
evidence. Quality is judged on the first 100 examples and the full 20-story
HypeBench seed — not on two stories.
