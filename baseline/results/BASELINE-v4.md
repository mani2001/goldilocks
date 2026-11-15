# Baseline v4 — prompted Qwen3-235B-A22B, fixed prompts + normalizer (2026-11-15)

**Runner:** v3 (prior-art candidates in Pass A, score calibration + category guidance
+ output-field discipline in Pass B, deterministic normalizer). Same model, same
stories, same snippet evidence as v3 — the only change is the prompts/rubric.
Previous outputs preserved in `results/...-snippets-v3/`.
**Cost:** 7,912 prompt + 3,358 completion tokens — roughly $0.004.

## Scores

| Story | Hand | v2 (URL-only) | v3 (snippets) | v4 (fixed prompts) |
|---|---|---|---|---|
| DeepSeek R1 | novelty 5, slop 2 | 3 / 4 | 3 / 4 | **5 / 2** |
| Humane Pin | novelty 3, slop 4 | 3 / 4 | 3 / 4 | 4 / 3 |
| Validation | passes | passes | fails | **passes** |

## What the fixes did
- **R1 is now an exact match (5/2).** Prior art names o1; claims table correct;
  category, access, confidence all right. The calibration guidance worked as
  intended on the real launch.
- **Pin category fixed** (`tool`), substance right, both prior-art entries right
  (Apple Watch + Ray-Ban Meta), claims table right.
- **Validation passes.** The normalizer fired once (dropped an invented
  `battery_life` undisclosed value) — the backstop works.

## What is still wrong — smaller, and specific
1. **Prior art now over-fires on R1:** o1 is correctly named, but so are AIME,
   MATH-500 and SWE-bench Verified — benchmarks are not products. Pass A listed
   them as candidates and Pass B copied them uncritically. Fix: candidates must
   be products/companies, never benchmarks, metrics, or datasets.
2. **Slop calibration overshot on the Pin (3 vs hand 4).** The guide says "most
   claims confirmed → slop 2", and here 3 of 6 claims ARE confirmed — but all
   three are commercial facts (price, subscription, order date) while every
   capability claim is self-reported. Fix: weight claims by kind — capability
   and benchmark claims carry the slop judgement; a confirmed price does not
   cancel an unproven capability claim. (Novelty 4 vs hand 3 is a genuine
   judgement call one point apart; the slop gap is the real signal.)
3. **Undisclosed kitchen sink persists on the Pin** (6 items incl. param_count,
   license, rate_limits for hardware). Fix: per-category undisclosed guide in
   the rubric — e.g. for tool/hardware, param_count/training_data/license are
   not applicable.

## Verdict
The frontier teacher now matches the hand verdict on the real launch and is one
point off on each score for the slop case, with valid output. Remaining fixes
are three small, targeted prompt/rubric changes (products-only prior art,
kind-weighted slop, per-category undisclosed guide). One more iteration should
close the baseline.
