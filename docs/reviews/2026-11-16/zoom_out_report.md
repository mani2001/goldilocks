# Stage 5: Initial Zoom Out Review

Date: 2026-11-16. Target: `inputs/concepts_brief.md`, lines 1–346. Mode: REVIEW, consolidated run. Input identity is recorded in `input-sha256.json`.

Reviewers completed: `stage5_zoom` (egm-zoom-out) and `stage5_catalyst` (egm-inventive-catalyst), each spawned with `fork_turns: "none"`. Both read their bundled personas, the zoom-out standard, the target, PLAN, README and every source/image in `review-context.json`. Both explicitly reported opening all seven PNGs with `view_image`. No reviewer was missing or failed.

## Verdict

Revise. Zoom-out returned three Majors and one Nit, with no Blocker. Catalyst returned one Major and two Nits, all advisory. Findings overlap and must not be counted as seven distinct defects.

The objective and selection timing are clear. Local learned inference, one initial selection retained throughout the task, and testing learned price sensitivity are explicit choices with empirical questions; neither reviewer found those choices intrinsically unjustified. The catalyst reported no false compromise in those choices. Planned experiments have not been executed.

## Zoom-out findings

### Z5-1 — Major: Failure handling bypasses the hard-constraint boundary

Scope: brief lines 216–224, 245–248, 271, 276–281; component diagram.

The brief guarantees never breaking a hard constraint but says never to block a spawn and to keep the parent model by default, including when all candidates were filtered out. The diagram routes an empty eligible set directly into that fallback. A parent outside the task's allowed list or residency boundary would violate the filter's guarantee.

Require every returned model/provider, including fallback, to satisfy the same hard constraints. Distinguish inference failure with an eligible fallback from genuine infeasibility. Return a visible no-selection result when no eligible model exists. Do not silently relax constraints.

### Z5-2 — Major: Runtime optimizations are promoted before workload evidence

Scope: brief lines 239–241, 263, 266–271, 288, 329.

The ideal result bundles a shared daemon, quantization, decision caching, precomputed vectors and sub-100-ms CPU inference while runtime packaging and hardware remain open. Selection happens only at conversation/subagent start, and v1 supports one harness. Evidence caching has a reuse rationale; decision caching lacks repeat-request or bottleneck evidence and adds invalidation across prompts, constraints, evidence, weights and calibration.

Keep process lifetime and quantization as benchmark candidates behind the existing interface. Defer decision caching and multi-harness sharing unless measurements justify them. Retain explicit latency-budget and timeout decisions.

### Z5-3 — Major: An unaccepted hybrid is presented through unjustified guarantees

Scope: brief lines 176–184, 251, 259, 268–271, 299, 314, 322, 327.

The hybrid is said to remove the token limit, support any pool size and remove refresh drift by design. It removes candidate text from the encoder budget, not the task's own limit or finite scoring costs. Numeric features can still reveal identity and undergo distribution or calibration shifts. Provider lookup also appears as the ideal despite remaining open; provider prices can affect which model is best value.

Label the hybrid and provider lookup as alternatives until decided. Narrow claims to reduced candidate-token pressure and removal of explicit identity features. Preserve price, held-out-pool and calibration tests regardless of representation. Moving price handling into code requires the comparison in PLAN §6.4.

### Z5-4 — Nit: The reuse assessment only names competing products

Scope: brief lines 134–142, 302, 335.

Existing routers have not been weighed, yet the brief says gateway routers cannot supply several capabilities. Local distillation may justify a new engine without establishing that evidence normalization, identifiers, adapters and evaluation components must be rebuilt.

Complete a concise requirements comparison and identify reusable parts separately from whole-product alternatives. Keep unsupported competitor claims marked unverified. This need not reopen B.

## Inventive catalyst findings

### IC5-1 — Major: Separate selector availability from permission to execute

Scope: brief lines 216–224, 245–248, 271, 276–281; component diagram source lines 14–15 and 25–29.

Same core conflict as Z5-1. No architecture can make execution compliant when no candidate meets the hard constraints. Segment the existing failure policy into eligible-fallback and no-feasible-choice cases, reusing the same constraint checks rather than adding a service.

Secondary costs: some tasks stop or require configuration changes; constraint checking must survive inference failure, and corrupt evidence may prevent proving eligibility. These costs follow from retaining the hard-constraint guarantee.

### IC5-2 — Nit: The hybrid reduces token pressure, not distribution shift by design

Scope: brief lines 169–184, 259, 299, 314, 322–323.

Same core issue as Z5-3. Separating task encoding from numeric candidates does not remove task length bounds, feature-derived identity shortcuts or drift. Keep the structural benefit bounded and retain empirical tests.

Secondary costs: normalization and missing-value contracts, separate scoring-head training/deployment, possible loss of useful task–candidate interactions, and a remaining long-task policy.

### IC5-3 — Nit: The confidence resolution changes the predicted event

Scope: brief lines 89–90, 157–167, 262, 309, 321; component/training diagrams.

S2 and the diagrams define teacher-agreement confidence; the trade-off table defines probability of being within epsilon of the best cost-adjusted option. The latter needs a defined objective and outcome evidence. Relabelling teacher-agreement confidence cannot supply that evidence.

Keep distillation confidence separate from product-value evaluation. Treat epsilon-based confidence as an alternative requiring an explicit decision and suitable labels.

Secondary costs: teacher agreement tells less about task success; outcome-based confidence adds measurement, objective definition and recalibration. No extra runtime confidence field is required.

## Read receipts and limits

Both reviewers read the complete target, PLAN (319 lines), README (75 lines), all seven Mermaid sources and all seven rendered PNGs, plus their required persona and zoom-out standard. There were no missing required files.

Zoom-out searched the repository for existing decision, evidence, ranking, serialization and calibration code and found only documentation; referenced VPS artifacts were unavailable. Neither read previous review reports or retrieved memory. No source code was changed and no model, provider, harness, price-variation, calibration, latency or full-task experiment ran. Historical spike statements are document assertions, not newly reproduced evidence. Host instruction-file isolation was not independently verified.
