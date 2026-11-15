# Baseline v3 — prompted Qwen3-235B-A22B WITH evidence snippets (2026-11-15)

**Runner:** v2 (snippets in Pass B input). Same model, same stories, same evidence — the
only change vs v2 is that each evidence item now carries a short summary of what
the source says. Previous URL-only 235B outputs preserved in
`results/Qwen_Qwen3-235B-A22B-Instruct-2507-url-only/`.
**Cost:** 7,054 prompt + 3,483 completion tokens — roughly $0.004.

## Scores

| Story | Hand | v2 (URL-only) | v3 (snippets) |
|---|---|---|---|
| DeepSeek R1 | novelty 5, slop 2 | novelty 3, slop 4 | novelty 3, slop 4 |
| Humane Pin | novelty 3, slop 4 | novelty 3, slop 4 | novelty 3, slop 4 |
| Validation | passes | passes | **fails** (see below) |

Top-line scores unchanged — but the claims tables underneath changed completely.

## What the snippets fixed (the real result)
- **R1 claims table now correct:** params, distills, pricing and license all
  `confirmed` (v2 had params and pricing self_reported); benchmarks correctly held
  self_reported; `price_known: true`; access right. The model finally *used* the
  evidence instead of guessing.
- **Pin claims table fully correct**, prior art Ray-Ban Meta kept, substance
  corrected to `new_capability` (v2 said `integration`).

## What is still wrong — the next layer down
1. **Prior art still broken on R1: `[]`.** o1 is named in the story and in the
   snippets, and the model still lists nothing. Cause: Pass A's prior-art queries
   are generic ("open source reasoning models similar to R1") — they never name
   the incumbent the story itself measures R1 against. Fix: Pass A must name
   incumbents mentioned in the story as prior-art candidates directly, and Pass B
   must treat "the thing this launch claims to beat" as prior art.
2. **Scores are downstream of prior art + headline-anchoring.** Novelty stays 3
   because with no prior art the model cannot score newness; slop stays 4 because
   the model anchors on the headline benchmark claim being unverified, even though
   4 of 6 claims are confirmed. Fix: rubric scoring guide — slop weights the whole
   claims table, not just the headline; novelty is scored against the delta vs
   named prior art.
3. **Format regressions from snippet copying (validation fails):** R1 verdict emits
   `"check": null` on non-registry evidence; Pin verdict copies the `snippet` field
   into the output evidence and invents `battery_life` in `undisclosed` (not in the
   enum). Fix (both): Pass B prompt must say explicitly "output evidence carries
   id, url, independent, and `check` ONLY when registry — never copy `snippet`
   into the output, never emit `check: null`; `undisclosed` only from the enum" —
   PLUS a deterministic normalizer in the labelling pipeline that strips unknown
   fields and nulls before validation.
4. **Category error starts in Pass A:** the Pin is classified `model_release` at
   extraction and Pass B inherits it. Fix: Pass A classification guidance (a
   hardware device launch is `tool`, not `model_release`).

## Verdict
Snippets work — the evidence-use problem is solved. What remains is
prompt/rubric calibration (prior art, score anchoring, category, output-field
discipline), all fixable before labelling. The 235B remains a credible teacher;
the next iteration is prompt fixes + rerun, not a model change.
