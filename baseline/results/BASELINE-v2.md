# Baseline v2 — prompted Qwen3-235B-A22B (2026-11-15)

**Runner:** same as v1, model `Qwen/Qwen3-235B-A22B-Instruct-2507` (the lean-teacher candidate).
**Cost:** 5,898 prompt + 3,110 completion tokens — roughly $0.003 at Token Factory rates.
**Raw outputs:** `results/Qwen_Qwen3-235B-A22B-Instruct-2507/`.

## Scores vs hand verdicts and the small model

| Story | Hand | Small (30B-A3B) | Frontier (235B) |
|---|---|---|---|
| DeepSeek R1 | novelty 5, slop 2 | novelty 3, slop 4 | novelty 3, slop 4 |
| Humane Pin | novelty 3, slop 4 | novelty 4, slop 3 | novelty 3, slop 4 |
| Validation | passes | **fails** (evidence as arrays) | **passes** |

## What the frontier model fixes
- **Format:** both verdicts pass `validate.py` cleanly — evidence as proper objects, key order right, citations resolving, independence rule respected.
- **The Pin, nailed:** novelty 3 / slop 4 / med, exactly the hand card. The laser, cellular and camera claims correctly marked self_reported (where the small model confirmed everything), Ray-Ban Meta found as prior art, access announced via [device].
- **Claim discipline in general:** benchmark claim held self_reported on R1; price/subscription confirmed on the Pin.

## What it still gets wrong — and the real finding

**R1 is wrong in exactly the same way as the small model** (novelty 3, slop 4). The pattern:
- 671B params marked self_reported — the HF registry check should confirm it.
- API pricing marked self_reported, `price_known: false` — evidence 5 contains the exact prices.
- prior_art: **[]** — o1, named in the story itself, not listed.
- undisclosed is a kitchen sink (pricing, license, param_count — all actually known).

**Root cause — a pipeline flaw, not a model flaw:** Pass B only receives evidence as **URLs + independence flags**. The model never sees what the evidence *says*. It cannot confirm the pricing because it never saw the pricing page's contents; it cannot name prior art confidently because it has no retrieved facts to cite. The hand runs worked because I actually read the pages. Both models failed R1 the same way because both were judging blind.

**Design fix required before Day-1 labelling:** the fetch step must produce **evidence snippets** — a short claim-relevant summary of each evidence item (what this source says, with the key facts), passed into Pass B alongside the URL. Without this, teacher labels inherit the same blindness, and the fine-tuned model learns to guess instead of verify.

**Secondary issues (fine-tuning targets, not blockers):**
- Category errors: the Pin was classed `model_release` / `integration` instead of `tool` / `new_capability`.
- Undisclosed kitchen sink persists at frontier scale — the rubric needs a per-category guide for what "undisclosed" means.
- Prior art retrieval is weak without retrieved facts to cite (should improve with snippets).

## Verdict on the baseline (both halves)

- Prompting a small model: judgements wrong in both directions, format invalid. **Fine-tune justified.**
- Prompting a frontier model: format valid, the slop case nailed, but the real launch missed — because of the evidence-blindness flaw. **Teacher labelling is viable, but only after the evidence-snippet fix.** The 235B is a credible lean teacher once it can actually see the evidence.
