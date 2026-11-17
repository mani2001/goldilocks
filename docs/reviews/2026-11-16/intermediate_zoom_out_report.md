# Stage 8: Intermediate Zoom Out Review

Date: 2026-11-16. Target: `inputs/concepts_brief.md`, lines 1–346, unchanged through stages 5–8. Reviewer: `stage8_zoom`, egm-zoom-out, fresh context with `fork_turns: "none"`, zoom-out standard. Completed; no missing reviewer.

## Verdict

Revise before drafting. Retain Approach B and one selection at conversation/subagent start. The design can remain one harness adapter, local selection, cached typed evidence and a separate training/evaluation pipeline. Necessary changes concern contradictory guarantees and boundaries; optional experiments must not silently become product requirements.

One Blocker, five Majors and one Nit. This stage reviews proposed fixes; no earlier-stage fixes were applied.

## Z8-1 — Blocker: Every execution path must preserve eligibility

Evidence: brief 216–224, 245–248, 271, 277–281; component source 14–15, 25–29 and PNG.

Adopt D7-1, Z5-1, IC5-1 and C6-2. Every fallback must satisfy the same constraints as a normal pick. Empty eligible sets and inability to prove eligibility require no-selection, not an unchecked parent/default. A conversation may have no parent. Qualify “never block a spawn.” Reuse the filter; do not add a policy service or elaborate error framework.

## Z8-2 — Major: Define the extraction boundary

Evidence: brief 106–125, 232–237; runtime-container source 6, 14, 24–25.

Adopt C6-1 and STY7-3; narrow D7-2 to the architectural requirement. Name the extractor, permitted inputs and authority, and isolation from the active conversation/ranker. Numeric validation cannot contain instructions acted on during extraction or detect all plausible misassociated values. Validate source, candidate and benchmark associations too.

A tool-less call without task context is one candidate, not the only proven solution. No exploit was reproduced. Keep extraction inside the existing refresh responsibility rather than mandating a new service.

## Z8-3 — Major: Choose one logging policy and defer production outcome collection

Evidence: brief 224–230, 260, 281, 289, 330.

Adopt C6-3 and STY7-8; narrow D7-3. State default logging behavior, whether prompt content is included and basic retention/deletion expectations. The smallest interpretation of the existing non-goal is opt-in local records without prompt text unless deliberately enabled. Defer separate tiers or specialized access-management machinery unless the chosen policy requires them.

The instruction to log outcomes for later recalibration builds toward production learning excluded from v1. Evaluation runs can measure G8 without production feedback infrastructure.

## Z8-4 — Major: Tie confidence to one measurable event

Evidence: brief 89–90, 157–167, 262, 309, 321; component source 13, training-container source 16.

Adopt C6-4, IC5-3, STY7-2 and the confidence part of STR7-3. Retain teacher agreement as accepted and mark the epsilon objective as an alternative, or reopen the definition consistently. Do not add a second confidence output merely to reconcile prose.

Contest the categorical claim at line 167 that richer labels/repeated sampling are required for calibration. Top-choice labels do not directly supervise the order among losers, but that does not establish scores for every candidate or repeated teacher calls as mandatory for teacher-agreement calibration. Treat richer labels as a budgeted experiment and define how runners-up are evaluated.

## Z8-5 — Major: Keep runtime and input alternatives provisional

Evidence: brief 176–184, 239–241, 251, 259, 263, 268–271, 299, 314, 322, 327, 329.

Adopt Z5-2, Z5-3, IC5-2 and STY7-1. Numeric candidates reduce candidate-token pressure, not task-length limits, finite pool costs, feature shortcuts or distribution shift. Provider lookup must preserve provider-sensitive model economics.

Keep process lifetime, quantization and the hybrid as measured alternatives behind `run_decision.py`. Defer decision caching and multi-harness sharing without workload evidence. Preserve the shared versioned input format, constraint checks, timeout policy and price-variation test regardless of representation. PLAN §6.4 does not approve replacing learned price handling with code.

## Z8-6 — Major: Fallback recommendations introduce unaccepted selection paths

Evidence: brief 26, 41, 214, 280–281, 296–298; runtime-context source 14–18.

Alternative C is rejected partly to avoid per-decision API cost, but its mitigation recommends LLM escalation on low confidence. Together with a rules fallback, this could create three runtime selectors before the failure contract is settled.

Defer C as runtime escalation and retain it as a comparison in evaluation. Choose the smallest deterministic eligible fallback sufficient for G6; an eligible configured default may suffice. Promoting any baseline into production requires an explicit decision. Online escalation would need a separately accepted privacy, cost and offline-behavior contract. This does not show B has failed.

## Z8-7 — Nit: Consolidate decisions and bounded reuse evidence

Evidence: brief 124, 135–142, 200–208, 232, 240–243, 253, 296–302, 318–335; README 19–28, 39–55, 69–75.

Adopt C6-5, STR7-3/4/5/6 and STY7-4/5/6/7/9 as concise corrections: keep publication optional, reconcile README precedence, fix references and numbering, qualify integration evidence and numerical assumptions, and remove unsupported competitor exclusions/repetition.

Narrow STR7-1/2 and Z5-4. Preserve B; replace unsupported personal attribution with concrete rejection rationale or a decision reference. A short requirements comparison and component-reuse inventory suffice; no exhaustive market study or automatic reopening of B.

The reuse search found only documentation and diagram sources for decision execution, evidence fetching, ranking, serialization and calibration. Referenced VPS baselines/data were not available. PLAN's historical rules baseline relaxes a quality floor, so it cannot automatically become a runtime fallback without reconciling hard/soft constraints.

Keep the teacher pilot, full-task evaluation, initial-prompt sufficiency test, first-harness checks, price-variation test and frozen acceptance thresholds as planned work. Their acknowledged absence is not proof of failure. Finish the first harness's two paths before requiring unrelated harness spikes.

## Read receipt and coverage limits

Read the complete target (346 lines), PLAN (319), README (75), context manifest, seven Mermaid sources and seven corresponding PNGs (actually opened through `view_image`); bundled zoom-out persona and standard; and current-run zoom-out, comprehension and critic reports. Recovered initially truncated text with separate reads. Performed narrow repository inventory/symbol searches excluding review reports. No required file was missing.

No memory, parent history, archived previous reports, external research, writes, delegation or provider calls. No integration, model, pricing, licensing, exploit or performance claim was independently tested. This is a document/mitigation review; read receipts are reviewer-reported.
