# Stage 7: Critic Review

Date: 2026-11-16. Target: `inputs/concepts_brief.md`, lines 1–346. No implementation plan. The exact input revision is recorded in `input-sha256.json`.

| Reviewer | Standard | Completion | Raw verdict |
|---|---|---|---|
| stage7_design / egm-design | feature-spec-standard | completed | Request changes: 1 Blocker, 2 Majors |
| stage7_structural / egm-structural | feature-spec-standard | completed | Needs revision: 4 Majors, 2 Nits |
| stage7_style / egm-style | persona only | completed | Changes requested: 8 Majors, 1 Nit |

Each reviewer ran in a fresh context (`fork_turns: "none"`) and returned a read receipt for its persona, applicable standard, all 346 target lines, all 319 PLAN lines, README, all seven Mermaid sources and all seven PNGs actually opened with `view_image`. Required reading was reported complete. Counts are per-reviewer observations, with overlaps; they are not distinct defect totals. The sections below retain every finding ID and its substance in edited, concise form.

## Design findings

### D7-1 — Blocker: Fallback bypasses the hard-constraint guarantee

Evidence: brief 216–224, 277–281; component source 14–15, 25–29 and matching PNG.

The empty-pool failure can retain the parent/default model and continue spawning without establishing eligibility. Invalid requests and corrupt evidence can also enter fallback without validation. This conflicts with G2 whenever the fallback is outside the allowed list or violates another hard constraint.

Require the same eligibility validation for every fallback. Return explicit no-selection when no eligible candidate exists or eligibility cannot be established. Restrict the promise never to block to cases with a validated fallback. Detailed error schemas may remain open; the precedence of hard constraints cannot.

### D7-2 — Major: Numeric validation does not protect the extractor reading untrusted pages

Evidence: brief 106–109, 119, 123–125, 232–237; runtime-container source 6, 14.

The harness LLM reads cached page text before output numbers are checked. Validation of `results.json` cannot undo instructions acted on by the extractor. The asserted free-text boundary contradicts the extraction flow. Plausible values attached to the wrong model or benchmark can also pass numeric checks.

Separate extraction from the parent/orchestrator and ranker. The reviewer proposes a tool-less isolated extraction call without user-task context or secrets, followed by identity, benchmark/version and source-association validation as well as numeric checks. If safeguards are deferred, remove the current safety assurance and require the boundary to be settled before drafting. This is a design risk, not a reproduced exploit.

### D7-3 — Major: Logging could retain private prompts without a clear consent policy

Evidence: brief 224–230, 281, 289; input definitions 31–33, 313; deferred schema 330.

The brief requires logging inputs/every decision but also says local logging is opt-in. Inputs include user prompts or repository task instructions. The alternatives imply materially different durable-storage behavior; no retention or content-minimization boundary is stated.

Choose one consent policy, state whether inputs include prompt text, and define retention/deletion/access boundaries. Reviewer recommendation: opt-in records, minimized operational metadata, deliberate separate enablement for prompt-bearing logs. File formats and rotation mechanics can remain open.

### Design assessment of experiments

The reviewer did not treat explicitly unmeasured teacher quality, local latency, integration support, economics or opening-prompt sufficiency as newly discovered failures. PLAN §6.4 improves the design by isolating price changes, recomputing derived costs, preventing prompt-variant leakage, testing provider reversals and dominance, separating unseen pools, and requiring thresholds to be frozen before final testing. It neither proves learned ranking works nor requires moving price handling to code. Existing-router comparison remains incomplete; alternatives A and C state concrete trade-offs.

## Structural findings

The heading hierarchy is valid: one H1; Overview, Analysis, Goals vs. Non-Goals, Alternatives Weighed, and Key Decisions & Staging as H2; appropriate H3 subsections. All applicable topic areas exist. The standard does not require exact heading names, H4 risk labels or a particular section ordering.

### STR7-1 — Major: Personally attributed rejections lack the standard's supporting links

Evidence: brief 296, 298–301. The standard requires an issue/discussion/PR link when attributing rejection to a maintainer; “Rejected by author” supplies none. Either provide the decision reference or state the concrete design rationale directly without personal attribution. Preserve the stated choice of B; no public publication is required to remove the attribution.

### STR7-2 — Major: Alternatives evaluation is incomplete

Evidence: brief 299, 302; PLAN 14–23. D is rejected without a concrete rejection trade-off while the hybrid's status remains open. Four existing routers are explicitly “Not yet weighed”; general market claims do not complete a requirements comparison. State D's trade-off and distinguish the unresolved hybrid; complete the concise tool comparison or supported scope exclusions.

### STR7-3 — Major: Repeated decisions have incompatible status

Evidence: brief 124 versus 232 (optional/chosen snapshot); 90, 262, 321 and component source 13 (confidence accepted/alternative/open); 281 versus 289 (mandatory/opt-in logging). Choose authoritative decision entries and reference them from summaries. Keep publication optional unless accepted and update diagram labels if the confidence decision changes.

### STR7-4 — Major: Document precedence leaves the README unclassified

Evidence: brief 5, 335, 285–291, 310–311; README 25–28, 39–41, 54–55. The brief supersedes PLAN, but README still presents live search, extra outputs and the custom eval set as current design. Extend precedence to README and add a reciprocal historical-status pointer when editing it. PLAN §6.4 is a valid current reference because the brief explicitly incorporates it and §6.4 points back to the brief for scope.

### STR7-5 — Nit: Wrong PLAN section reference

Evidence: brief 174 cites §4.1 for single-sequence input; that section is an output table. The relevant input statement is PLAN §3.3 (98–100); pairwise scoring is §3 (83). Correct the reference to §3 versus §3.3.

### STR7-6 — Nit: “2a.” is not an ordered-list marker

Evidence: brief 318–321. Use consecutive integers or a nested bullet so evidence licensing gets the same Markdown structure as the other decisions.

Structural checks found valid local Markdown destinations, a matching §6.4 anchor, consistent table columns and no unclosed code fences. The dynamic PNGs depict once-at-start selection consistently with their sources.

## Style findings

### STY7-1 — Major, CALIBRATE: Hybrid guarantees exceed its mechanism

Evidence: brief 177, 299, 322. Numeric candidates reduce candidate-token use and remove explicit names. They do not establish unlimited task length/pool size or refresh-drift immunity. Replace the absolute claims with bounded benefits and retain evaluation requirements; the hybrid remains a recommendation pending decision.

### STY7-2 — Major, CALIBRATE: Confidence has incompatible meanings and statuses

Evidence: brief 90, 158, 262, 321; component source 13 and training-container source 16. Teacher agreement, near-optimal cost-adjusted selection and an unresolved event cannot simultaneously define the output. State the current definition and mark alternatives explicitly, or mark both open.

### STY7-3 — Major, CALIBRATE: Free-text assurance contradicts extraction

Evidence: brief 106, 119, 125, 237. Clarify that only validated features reach the ranker while an extractor reads untrusted pages; isolation from the active parent remains to be designed. This wording correction does not claim a demonstrated exploit.

### STY7-4 — Major, CALIBRATE: Snapshot publication is optional and decided at once

Evidence: brief 124, 232, 253, 320. Keep publication optional pending licensing; distinguish documented redistribution restrictions from an unresolved permission question rather than asserting both.

### STY7-5 — Major, CALIBRATE: Harness summaries drop evidence qualifications

Evidence: brief 200, 203–204. “Pi works fully” overstates a tested main-session route with subagent behavior inferred but not run. “Claude Code cannot switch the main session's model” overstates the specific prompt-submit-hook limitation while the document names launcher/manual routes. Narrow summaries to the recorded version, tested mechanism and actual coverage.

### STY7-6 — Major, CALIBRATE: Numerical estimates lack usable assumptions

Evidence: brief 240, 243, 319, 346; PLAN 293. Laptop CPU latency lacks hardware, precision, input size or measurement reference. Label-budget multipliers and $280–560 per pass lack a named teacher/rates/token-count calculation while teacher selection remains open. Label estimates honestly and give assumptions, or leave numbers pending measurement and teacher selection. Retain the spending cap.

### STY7-7 — Major, CALIBRATE: Differentiators are asserted as competitor limitations

Evidence: brief 135–142, 302. The list of things a gateway router “cannot do” is unsupported while the comparison remains unperformed. Present these as requirements/differentiators to verify, not established absences in competitors.

### STY7-8 — Major, CALIBRATE: Logging is mandatory and opt-in

Evidence: brief 224, 281, 289, 330. Align both mandatory-sounding instructions with the selected consent policy. If opt-in, say “When local logging is enabled, record every decision using the agreed schema.” Do not imply unconditional prompt retention.

### STY7-9 — Nit, DROP/RELOCATE: Repetition obscures the decision record

Evidence: brief 26, 93–98, 214, 297, 308–309, 333 (B rationale); 13–14, 33, 128–131, 205, 267, 276, 313 (timing); 146 (reviewer agreement claim). Keep overview, diagrams, goals and decisions; shorten other repetitions to references. Drop “agreed with each other more than usual” and replace stale claims about settled assumptions with the specific remaining open items.

## Coverage limits

These are document reviews, not executed security, model, integration or performance tests. No source documents were modified. No reviewer consulted memory, earlier reports or parent history, or made provider calls. Historical spike statements were checked for internal consistency, not independently reproduced. Read receipts are reviewer-reported; this host does not expose a separate child tool trace through the collaboration API.
