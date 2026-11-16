# Stage 8: Intermediate Zoom Out Review

**Target:** `concepts_brief.md` (not edited since Stages 5–7).

**Reviewer:** egm-zoom-out, run in a fresh context against the `zoom-out-standard`. It also read the Stage 5–7 reports.

**Not checked:** 4 of the 6 `.mmd` sources, the PNGs, the VPS artifacts, and whether LLMRouterBench's measured outcomes can train a task-needs model.

**Verdict:** changes required. 2 Blockers, 7 Majors, 3 Nits.

**Overall:** applying every Stage 6–7 fix as written would make the brief bigger and lock it further into Approach B. Most of the Stage 7 Majors are ways to make B safer. They should wait until the engine decision is made.

## Blocker 1: The fixes harden B before B is decided as the v1 engine
Stage 5 said not to build B in v1. Stage 7 then proposes about eight fixes that only matter if B ships:
- C2: the B+D hybrid.
- C4: training-diagram perturbation.
- C7: truncation and context extension.
- C10: an unfamiliar-input detector.
- C14: teacher-gate thresholds.
- Risk 2: refit the temperature after masking.
- Risk 3: name-memorisation defences.

**Fix:** make the engine decision first and record its reason. Treat every B-only fix as conditional on that decision.

## Blocker 2: Learning price inside the model is the root cause of the largest group of mitigations
*This changes the reviewer's Stage 5 view.*

Price is a number that changes daily, and the model has to learn it. That is why these exist:
- S1 counterfactual labels and the price-shift test set.
- Risk 2 calibration drift.
- The Risk 3 name shortcut.
- The Risk 10 cost multipliers.

A cost formula in code handles a price change exactly, with no labels. Risk 12 already uses this argument to take *provider* out of the model; the same argument applies to *cost*. The Day 0 result also points this way: "feature gap, not model gap", and the teacher matched the rules engine.

**Fix:**
- **v1:** use Approach A. Code scores the needs implied by the subagent type against candidate capabilities and the cost per task.
- **Later:** use Approach D. A learned part reads only the task and predicts its needs; price never enters the model. It could be trained on LLMRouterBench's measured outcomes, which needs no teacher. Whether those outcomes are enough is unverified.

The reviewer now recommends A rather than "A or C". On Day 0, C made the same picks as the rules engine.

## Majors
1. **C1 (crawled text reaches an LLM that has tools).** Adopt the "structured sources only" option and reject the sandboxed-LLM option. The sandboxed option adds an LLM dependency, a second key, and checks on the extracted numbers. The structured option also settles C3: `fetch_evidence.py` becomes the only refresher, using code only, and the refresh skill is deleted.
   - **Point not raised earlier:** v1 has one benchmark source. So "one crawler key" and "one Artificial Analysis key" are the same amount of setup, and the Artificial Analysis key returns typed data. Whether Artificial Analysis allows redistribution (open item 2a) becomes the top open item.
2. **Reject the extra refresh machinery.** That covers the background refresh, the single-flight lock, version rotation, and the 404/429 triggers. Keep a staleness check in code, a warning when the file is stale, and an atomic write.
3. **Fallback.** Keep one fallback: the parent's model. Drop the rules engine, A and C as further fallback layers, and drop the unfamiliar-input clause from G6.
4. **Outcome signals and the log.** Drop the post-run outcome signals from v1. Log the pick, its inputs and the fallback reason, without the prompt.
5. **One gate on measured outcomes.** Reuse the 100-task set with its `success_criteria` (about $2–5) as the single product gate, in place of the three-part teacher pilot. For confidence, keep one meaning; under A it is the score margin. Mark the ε version as future work.
6. **Stage 7 adds implementation detail back into the brief.** That covers the thresholds, schemas, locks, policies and per-harness hooks. Move all of it to `/egm-draft`.
7. **The G4 baseline list keeps growing.** For v1, use two baselines: the rules engine and the subagent-type map. The learned-model baselines belong to a later stage.

## Nits
1. C11 (the Claude Code reroute widening a subagent's tools) is out of v1 scope. Record "the requested agent's tools must survive the reroute" as an entry condition for supporting Claude Code later.
2. From C7, keep only the deletion of "well under 100 ms".
3. For undefined terms, delete before you define. Delete RLCD and the `choice` head. Add glosses only for terms that stay: student, Day 0, capability mapping.

## Adopt as written
- C5: one harness, OpenCode, provisional.
- C6: choose the provider with a lookup in code.
- C3: the refresher is `fetch_evidence.py` alone.
- C8: one teacher and one per-call cost figure.
- C2, partly: define A–D, add a B entry, one line per existing router, and answer the feature-gap finding.
- C15: add the missing rows to the change table.
- C16: remove the unsupported superlative.
- C17: fix the broken list numbering.
- C4: update the diagrams, after the decisions are made.

## Reject as over-engineering for v1
- The sandboxed LLM extraction.
- The background refresh, lock and version rotation.
- The 404/429 refresh triggers.
- The unfamiliar-input detector.
- The fallback chains.
- The post-run outcome hooks.
- The three-part teacher pilot.
- The context-extension and concurrency plans.
- Defining ε now.
- A seven-baseline G4.
- The Claude Code tool-preservation design.

## The minimal coherent v1
1. **Harness:** OpenCode only. Its spawn hook runs `run_decision.py` as one process per call, with no daemon.
2. **Evidence:** `fetch_evidence.py`, code only. It reads provider `/models` APIs and one structured benchmark source: either the published snapshot or the user's own Artificial Analysis key. It checks staleness and writes atomically.
3. **Engine:** a hard-constraint mask, then Approach A (the needs implied by the subagent type, scored against capabilities and cost per task). The provider comes from a cheapest-eligible lookup.
4. **Output:** the pick, a margin-based confidence (labelled as such), and the runners-up.
5. **Failure handling:** keep the parent's model. Write a local log without the prompt.
6. **Gate:** measured outcomes on the 100-task set, against the rules engine and the subagent-type map.
7. **Out of v1:** picking the main session's model.
8. **Later stage:** teacher labelling and Laya (B or B+D), with price kept out of the model. This stage must beat v1 on the same gate.

**Risk:** this v1 depends on two things to check before drafting. First, whether Artificial Analysis allows redistribution or this kind of use. Second, whether the subagent-type map gives A enough signal.
