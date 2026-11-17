## What this proposes

Goldilocks would choose a model and provider locally, once before a conversation or subagent task starts, and keep that choice for the entire conversation or task. A fine-tuned Laya model would learn a frontier teacher’s selections from LLMRouterBench prompts, using candidate features and cached evidence; code would enforce hard constraints. The output would include the pick, calibrated confidence and eligible runners-up. Better task results per dollar, economical local selection and the sufficiency of opening instructions are goals or hypotheses awaiting evaluation.

## How the existing system works, per this document

The document describes prototypes and integration experiments rather than an established end-to-end Goldilocks installation. A Day 0 prompted Qwen3 teacher made the same selections as a rules engine, with supporting artifacts still to be brought into the repository. Reported harness experiments show different degrees of model-selection control: Claude Code has qualified subagent support, OpenCode has a tested main-session path but an untested end-to-end subagent hook, Codex cannot expose the subagent prompt to the selector, and Pi requires a custom subagent mechanism. Hermes integration is explicitly unverified.

### C6-1 — Major: The extraction workflow contradicts its stated text boundary

**Target lines:** 106–111, 119, 125, 237.

S5 says an LLM extracts numbers from unstructured HTML, and S6 identifies that extractor as the harness LLM reading cached pages. Line 125 then says crawled text “never reaches the model or the orchestrator as free text”; line 237 repeats an unqualified prohibition on passing scraped text to “the model.” A fresh reader cannot tell whether this prohibition applies only to Laya, also to the parent agent, or to the very extraction LLM that the refresh workflow requires.

**Recommendation:** Name the extraction component and distinguish it explicitly from the decision model and parent conversation. State which component receives untrusted page text and where validation occurs before typed numbers enter `results.json`. This clarification does not require choosing the final extraction implementation.

### C6-2 — Major: Failure promises lack a compatible interpretation when no candidate is allowed

**Target lines:** 216–224, 245–248, 277, 281, 325, 330.

The failure list includes every candidate being removed by the mask. The ensuing instruction says to default to the parent’s model and never block a spawn, while G2 says never to break a hard constraint. If the parent’s model is not feasible, these statements cannot all govern the same failure; for conversation-start selection, there may also be no parent model to retain.

The detailed failure table is intentionally deferred, so its absence is not itself the finding. The comprehension problem is that the brief already states absolute requirements without explaining which governs this conflict.

**Recommendation:** Clarify whether fallback is subject to the same constraints and whether “never block a spawn” excludes an empty feasible set. Distinguish the source of the default for conversation starts and subagent starts, leaving detailed actions to the deferred failure table.

### C6-3 — Major: Local decision logging is both mandatory and opt-in

**Target lines:** 224–230, 281, 289.

Risk 7 requires a local log containing inputs and other decision details, and G6 says to log every decision locally. The non-goals qualify local logging as opt-in only. These statements give different answers to a basic user-facing question: does an ordinary installation persist decision inputs without the user enabling logging?

**Recommendation:** Use one explicit logging rule throughout. If logging is opt-in, qualify the mandatory-sounding statements accordingly and identify whether “inputs” includes the opening prompt. If mandatory operational records and optional detailed logs are intended to differ, describe that distinction.

### C6-4 — Major: The status of the confidence definition is inconsistent

**Target lines:** 89–90, 157–167, 262, 321.

S2 says the team accepts confidence as the probability that the teacher would make the same pick. The trade-off table instead proposes the probability of being within ε of the best cost-adjusted option. The staging list says the predicted event remains unresolved. Teacher agreement and proximity to a cost-adjusted optimum are different events, so a reader cannot give a single reliable paraphrase of what the required confidence output means or which definition is currently authoritative.

The brief is entitled to defer this choice; the issue is presenting one definition as accepted while also treating it as open.

**Recommendation:** Mark teacher agreement as either the current accepted meaning or a provisional candidate. Label the ε-based definition as an alternative requiring a separate reference target, and make the staging entry consistent with that status.

### C6-5 — Nit: A published evidence snapshot changes from optional to decided

**Target lines:** 124, 232, 320.

S6 presents a maintainer-published snapshot as optional and subject to an unresolved redistribution check. Risk 8 then says S4–S6 “chose” a published snapshot. The later licensing question confirms that publication remains unresolved, leaving uncertainty over whether users must configure a crawler or can expect a downloaded snapshot.

**Recommendation:** Change Risk 8 to say that cached JSON and validated evidence are chosen, while publication remains an optional delivery mechanism pending the stated checks.

## Read receipt and limits

Reviewer `stage6_comprehension` completed in a fresh context with `fork_turns: "none"`. Read the bundled comprehension persona and complete target `inputs/concepts_brief.md`, lines 1–346. Mode REVIEW; FeatureRange whole file; DetailedRange N/A; no document standard applied. Four Major findings, one Nit, no Blocker: the core proposal and reported existing experiments can be paraphrased.

Did not open linked documents, images, source code, memory or prior reviews; made no writes or provider calls. This intentional target-only stage assesses textual comprehension and internal consistency, not the accuracy of reported experiments or implementation claims.
