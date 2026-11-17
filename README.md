# Goldilocks

**Design status:** The current [concept brief](docs/concepts_brief.md) supersedes conflicting design statements here. [PLAN §6.4](docs/PLAN.md#64-price-variation-test-added-2026-11-16-required-before-release) remains the required price-variation plan.

A decision model that picks the right AI model for the task.

Every task has a model that's just right: capable enough to do the job well,
cheap enough not to waste money, fast enough to meet the deadline. Picking it
is a real decision with real stakes — quality, cost, latency, context,
modality — and today it's made by gut feel, stale benchmark tables, or
heuristics that route off prompt length.

Goldilocks makes that decision properly: a learned ranking head over a live
feature store, with reasons for every pick.

## How it works

**Input.** The task in plain words, plus constraints: max budget, latency
bar, quality floor, context needed, modality, open-weights-only, residency.

**Feature store.** Two signals, kept current:

- *Benchmarks* — Artificial Analysis, SWE-bench, LiveCodeBench, and others,
  mapped through a capability layer into six fixed dimensions (reasoning,
  coding, writing, vision, tools, knowledge) on a 0–5 scale. A new benchmark
  is a config update, never a retrain.
- *Live web evidence* — Tavily search, refreshed daily and on new-model
  detection: launches, price changes, real-world reports, deprecations.
  Benchmarks alone go stale; search alone is noise. Together they're current
  and comparable.

**Decision model.** A ModernBERT-class encoder turns the task and
constraints into an embedding. A ranking head scores every (task, candidate)
pair in a single forward pass — no tokens generated for the decision.
Candidates are model + provider pairs: the same model on two providers can
differ 15x in price. Hard constraints (availability, context, modality,
open weights, residency) are pre-filters, applied before ranking. Soft
trade-offs — how much quality headroom is worth the price — are the head's
job.

**Output.** A ranked list of candidates, one pick, reasons assembled from
feature deltas (not generated), and the unconstrained pick when the best
model isn't available to the user. Cost per task, not just cost per token.

## Why this is different

Existing routers fall into three traps: stale model data (hardcoded
benchmark tables), heuristic complexity (prompt length as a proxy for
difficulty), and silent misroutes (a cheap model plausibly wrong, 200 OK).
None of them learn from real outcomes, none treat constraints as first-class
ranking inputs, and none use live web evidence as a routing signal.
Goldilocks is built around all three gaps.

## Evaluation

- **Custom task set** — 100 constraint-aware tasks across 32 domains, split
  50/50 dev/test, each with success criteria for scoring real outputs.
- **LLMRouterBench slice** — a held-out slice of the 391k-record benchmark
  as the method eval (a separate, citable number).
- **Rules-engine baseline** — filter + sort by value. The head must beat it,
  and beat it where rules can't: the recall cases and the trade-off cases.

## Status

Day 0 complete: candidate data across three providers (OpenRouter, Nebius
Token Factory, Baseten), the 100-task eval set, and both baselines. The
rules engine scores 23/100 against hand-judged expected picks — the gap is
a feature gap, not a model gap, which is what Day 1 (teacher labelling)
addresses.

## Roadmap

- Day 1: teacher labelling (~1–2k tasks)
- Day 2: train the ranker (pretrained encoder, small ranking head)
- Day 3: ship — HuggingFace weights + dataset + model card, MCP server
  (`pick_model`) + CLI, demo Space
- Longer term: outcome learning from real picks — the moat no other router has
