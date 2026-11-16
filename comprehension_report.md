# Stage 6: Comprehension Test

**Target:** `concepts_brief.md` (whole file; no implementation plan)
**Reviewer:** egm-comprehension (fresh context), no document standard
**Files read:** persona, target, `PLAN.md`, all six Mermaid sources. PNG renders not opened.

## What this proposes

Goldilocks is a local plugin for coding harnesses (Claude Code, OpenCode, Codex, Pi). When a subagent is spawned, a hook passes the subagent's prompt, the user's allowed models and constraints, and a cached evidence file (`results.json`) to `run_decision.py`. It returns one model and provider, a calibrated confidence, and runners-up. The decision is made by Laya, a 421M ModernBERT-based encoder fine-tuned to copy a frontier "teacher" model's picks on LLMRouterBench prompts. Hard constraints are applied as a mask in code before the model scores anything. `fetch_evidence.py` refreshes `results.json` from a fixed allow-list of pages through one crawler key, and from provider model-list APIs. It runs when the file is stale or when the allowed list changes, never on each decision. The brief records team verdicts (S1–S8), lists 13 risks with mitigations, and leaves 17 items open before drafting.

## How the existing system works, per this document

There is no running system. There is a prior plan (`PLAN.md`) and a set of "Day 0" artifacts:
- a rules engine (`rules_engine.py`);
- a prompted Qwen3-235B teacher, which made the same picks as the rules engine;
- candidate price data;
- a 100-task hand-labelled set.

Some of these live on an unnamed "VPS". The brief drops the 100-task set, per-decision web search, and the extra output fields. A spike on 2026-11-15 tested the hook points in each harness:
- OpenCode and Pi can change both the model and the provider.
- Claude Code can change the model only through generated agent files.
- Codex receives the subagent prompt encrypted.

Every section could be paraphrased. Two places did not settle into one coherent account: the refresh pipeline and the meaning of confidence (findings 2 and 3).

## Findings

**1. Major: Approaches A–D are used before they are defined, and B is never defined as an alternative.**
- **Scope:** line 82 ("the inline approach (C)"), line 152 ("Approach B as written"), line 195 (Risk 6), lines 274–281.
- **Problem:** the letters first appear in S3, Risk 3 and Risk 6. They are defined only in "Alternatives Weighed", and that section defines A, C and D but never B. A new reader meets "B as written memorises names" without knowing what B is.
- **Fix:** define A–D briefly in the Overview, and add a B entry to Alternatives Weighed.

**2. Major: The brief gives conflicting accounts of who refreshes `results.json` and whether an LLM is involved.**
- **Scope:** lines 25, 91–96, 104, 108–109, 213–215, 290; `c4-context-runtime.mmd` line 11; `c4-container-runtime.mmd` lines 14 and 34–35.
- **Conflicts:**
  - Line 25 says "a skill and the scripts" refresh the file. Line 215 says "code, not the agent" checks staleness.
  - S5 says an LLM is needed only for unstructured HTML. S6 says the harness LLM converts the cached pages on every refresh. The brief never explains how a Python script calls the harness's LLM.
  - Line 213 says a published snapshot was chosen. S6 calls the snapshot "Optional". The container diagram says the snapshot is downloaded "by default". Decision 5 requires a crawler key.
  - The context diagram still lists the "Artificial Analysis API" as a source, which S6 rejected.
- **Effect:** a reader cannot tell whether a default install needs a crawler key, an LLM, or neither.
- **Fix:** describe the refresh path once, in order, and make the diagrams match it.

**3. Major: Confidence has three different meanings.**
- **Scope:** S2 (line 76), Risk 2 (lines 140–150), the trade-off table (line 243), open item 3.
- **Conflicts:**
  - S2 accepts "the probability the teacher would make the same pick".
  - Risk 2 says the event is still to be chosen.
  - The trade-off table says "within ε of the best cost-adjusted option", and ε and "cost-adjusted" are not defined.
- **Fix:** mark S2's meaning as the current claim and the ε version as a proposal, and define ε and the cost adjustment.

**4. Major: The cost-per-decision figures contradict each other.**
- **Scope:** Risk 6 (line 195), Risk 10 (line 224), S3 (line 80).
- **Conflict:** Risk 6 says a teacher call costs about $0.0003. Risk 10's $280–560 for about 24k prompts works out to about $0.012–0.023 per call, which is 40–75 times more. The $0.0003 figure matches the Day 0 Qwen3 teacher, not a frontier teacher. Risk 6's conclusion depends on this figure.
- **Fix:** name the teacher model each figure assumes and show the calculation.

**5. Major: The v1 harness targets contradict each other.**
- **Scope:** line 10, line 185, G1, the non-goals, Decision 6, line 307, line 324.
- **Conflict:** Decision 6 lists all four harnesses. G1 and the non-goals say v1 covers only the first harness. The spike says Codex is blocked.
- **Fix:** label Decision 6 as the long-term list, and state that v1 is one harness (OpenCode, pending verification).

**6. Major: Fallback behaviour is described four ways.**
- **Scope:** Risk 7 ("keep the parent's model"), line 244 (rules-engine fallback), G6 ("a default"), Alternatives A ("the fallback") and C ("escalation path"), and the component diagram.
- **Fix:** give one fallback order, in the Risk 7 failure table.

**7. Major: "Capability mapping" is not defined, and the brief reverses PLAN.md's rule without saying so.**
- **Scope:** line 107, Decision 9.
- **Problem:** the term is defined only in PLAN §3.1 (six fixed dimensions, 0–5, "new benchmark, no retrain"). The brief now makes adding a source a schema change, and the change table does not list this.
- **Fix:** define the mapping in one sentence, and add a row to the change table.

**8. Nit: The relationship between `run_decision.py` and "the daemon" is unclear.**
- **Scope:** lines 23–25, 198, 222, 248, 292, 308.
- **Problem:** the Overview says the hook calls a script, while the risks assume a daemon, and open item 11 leaves the choice open.
- **Fix:** say early that the daemon is a proposal, not a decision.

**9. Nit: Several terms are defined only in PLAN.md.**
- **Terms:** "Day 0", `rules_engine.py`, "the 100-task set" / "50 dev tasks", Laya's `choice` head, and the dropped field names.
- **Fix:** add a one-line gloss for each.

**10. Nit: "Student" is never defined.**
- **Scope:** line 63 onward.
- **Fix:** state that "the student" is the fine-tuned Laya.

**11. Nit: The teacher's identity is ambiguous.**
- **Problem:** Qwen3-235B is called "the prompted teacher", but elsewhere the teacher is an unnamed frontier model.
- **Fix:** say that Qwen3-235B was only the Day 0 teacher.

**12. Nit: "VPS" is undefined.**
- **Scope:** line 314.
- **Fix:** name the server or explain what it is.

**13. Nit: Some smaller terms are undefined.**
- "Constraint profiles" (line 224) is used before Risk 11 explains it.
- *k* in G1 has no value.
- "Via OpenRouter" (Decision 6) is explained only by the `ANTHROPIC_BASE_URL` note in Risk 5.

## Summary

There are no Blockers. Findings 2–6 are where the parts do not connect: refresh, confidence, cost figures, v1 harness scope and fallback.
