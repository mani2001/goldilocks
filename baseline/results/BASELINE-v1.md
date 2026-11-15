# Baseline v1 — prompted Qwen3-30B-A3B (2026-11-15)

**Runner:** `run_baseline.py` on the VPS, Token Factory, temperature 0, same Pass A/B prompts as `pipeline-prompts.md`, same evidence lists as the hand smoke tests (so the comparison isolates the model's judging, not the fetching).
**Cost:** 5,957 prompt + 3,107 completion tokens — under $0.01 at Token Factory rates.
**Raw outputs:** `results/Qwen_Qwen3-30B-A3B-Instruct-2507/` (pass-a + verdict per story, raw + parsed).

## Scores vs hand verdicts

| Story | Hand (reference) | Prompted Qwen | Verdict |
|---|---|---|---|
| DeepSeek R1 | novelty 5, slop 2, conf med | novelty 3, slop 4, conf low | Too cynical: under-scored the real launch |
| Humane AI Pin | novelty 3, slop 4, conf med | novelty 4, slop 3, conf high | Too credulous: over-scored the vapour |

The prompted model compresses toward the middle and gets the two stories **backwards**: the real launch reads as slop, the vapour reads as solid. It cannot tell the difference between the two — which is the entire job.

## Failure classes (what fine-tuning has to fix)

1. **"The press reported it" = "confirmed".** On the Pin it marked all six claims confirmed, including the laser projector working and the nutrition feature, because MacRumors/Tech.co repeated Humane's claims. Reporting a claim is not confirming it — the independence rule, applied in spirit, is exactly what the small model cannot do.
2. **Evidence it can't use.** On R1 it marked the API-pricing claim "unverifiable" and `price_known: false`, even though evidence 5 contains the exact prices. It read the evidence list but didn't connect it to the claims.
3. **Prior art as word salad.** R1's prior art: "Open-source reasoning models with 671 billion parameters" — not a product. (It did find Ray-Ban Meta for the Pin, plus Google Glass cited to the wrong evidence.)
4. **Format failure.** Both verdicts emit `evidence` as arrays `[id, url, tag]` instead of objects `{id, url, independent}` — so both **fail `validate.py`** (the format error cascades into "missing evidence id" for every citation). Key order, however, was exactly right on both — it follows the ordering instruction.
5. **Kitchen-sink undisclosed.** On the Pin it listed license, training_data and param_count as undisclosed — nonsense fields for hardware. It doesn't know what the enum means per category.
6. **Confidence inverted.** Low confidence on the well-evidenced R1 verdict, high confidence on the evidence-free Pin verdict.

## Verdict on the baseline

**The fine-tune is justified.** Prompting alone does not produce this behaviour in a small model: the judgements are wrong in both directions, the format is invalid, and the confidence is backwards. The gap between these cards and the hand cards is the training target — and it's large, which is good news: there is something real to learn.

Next: the frontier-model half of the baseline (same stories, same prompts, strong model) to set the ceiling, then Day-1 teacher labelling.
