# Consolidated EGM review — Goldilocks, 2026-11-16

**Verdict: revise before drafting.** Seven fresh-context reviewer runs completed across stages 5–8. Stage 9 was not applicable: the target is a concept brief with no detailed implementation plan. The synthesis contains **1 Blocker, 6 Majors and 3 Nits**; repeated observations are merged. These are design/document findings, not reproduced runtime defects.

The review supports retaining the stated product direction: a local learned selector, distilled from a frontier teacher, invoked once at conversation start or subagent start. It does not conclude that B is unjustified or that changing prices must be handled by code. The new price-variation plan is an appropriate test of that question. Its results, thresholds and the product's quality/cost benefits remain unverified.

## Reviewed revision and coverage

- Target: [concept brief snapshot](inputs/concepts_brief.md), lines 1–346, with [PLAN §6.4](inputs/PLAN.md#64-price-variation-test-added-2026-11-16-required-before-release), README and all seven diagrams/source files.
- Identity: [SHA-256 manifest](input-sha256.json); [reading list](review-context.json).
- Historical reports were preserved under [previous-reports](previous-reports/). They were not supplied to reviewers.
- Goldfish agents used `fork_turns: "none"` and were instructed not to retrieve memory/history. Host instruction-file isolation was not independently tested. Read receipts are reviewer-reported; separate child tool traces are unavailable through this collaboration API.
- Every reviewer except the deliberately text-only comprehension reviewer reported reading all supplied context and opening all seven PNGs. No failed or missing reviewer was counted as clean.
- No source design fixes, runtime benchmarks, model/provider calls or new harness tests were performed during review. The price test is specified, not executed.

| Stage | Reviewer runs | Result | Report |
|---|---|---|---|
| 5 — Initial zoom-out | Zoom-out + inventive catalyst | Revise; overlapping strategic findings | [Stage 5](zoom_out_report.md) |
| 6 — Comprehension | Comprehension, target text only | Proposal understood; contradictory requirements | [Stage 6](comprehension_report.md) |
| 7 — Critic | Design + structural + style | Changes required | [Stage 7](critic_report.md) |
| 8 — Intermediate zoom-out | Fresh zoom-out with current stage reports | Revise; narrow proposed fixes | [Stage 8](intermediate_zoom_out_report.md) |
| 9 — Implementation readiness | Not applicable | No implementation plan to review | — |

## Blocker

### R1. Hard constraints must also govern fallback

**Evidence:** brief 216–224, 245–248, 271, 277–281; component diagram source 14–15 and 25–29.

An empty eligible set can fall back to the parent/default model and still spawn, while G2 says no hard constraint may ever be violated. Invalid requests or corrupt evidence also reach fallback without proving eligibility. At conversation start there may be no parent model at all.

**Required decision:** every fallback must pass the same hard constraints. If no eligible choice can be established, return a visible no-selection outcome instead of launching an incompatible model. Qualify “never block a spawn” accordingly. Reuse the existing filter; no new policy service is needed.

## Majors

### R2. Establish the evidence-extraction trust boundary

**Evidence:** brief 106–125, 232–237; runtime-container source 6, 14, 24–25.

The harness LLM reads untrusted pages, but the brief claims free text never reaches the model or orchestrator. Validating numbers afterward does not constrain what the extractor can do while reading the page. Plausible values can also be associated with the wrong candidate or benchmark.

**Required decision:** name the extractor, its authority and isolation from the active task/parent, and validate source/candidate/benchmark associations as well as numeric values. A tool-less call without task context is one option; structured sources are another possible design direction. This review has not selected the implementation or reproduced an exploit. Keep responsibility within the existing evidence-refresh path.

### R3. Choose one consent and content policy for logging

**Evidence:** brief 224–230, 260, 281, 289, 330.

“Log every decision” and “opt-in local logging only” disagree. “Inputs” could include private opening prompts and repository instructions. Collecting production outcomes for later recalibration also extends into a v1 non-goal.

**Required decision:** state whether logging is opt-in, whether prompt text is excluded, and basic retention/deletion expectations. The smallest interpretation of the existing non-goal is opt-in records without prompt text unless deliberately enabled. Keep product-evaluation measurement separate from production feedback infrastructure. Do not add logging tiers or access-management machinery merely to resolve the prose.

### R4. Give confidence one meaning and test runners-up separately

**Evidence:** brief 89–90, 157–167, 262, 309, 321; component source 13; training-container source 16.

Confidence is alternately accepted as teacher agreement, defined as probability of being near the best cost-adjusted choice, and left unresolved. Those are different events with different labels.

**Required decision:** retain teacher agreement consistently or explicitly reopen the definition; mark the epsilon-based objective as an alternative. Do not add another output just to reconcile the text. Specify how runners-up will be evaluated. The final reviewer contests the claim that repeated sampling or full per-candidate teacher scores are inherently necessary for teacher-agreement calibration; treat richer labels as a budgeted experiment rather than a mandatory cost multiplier.

### R5. Keep the runtime and hybrid design provisional until measured

**Evidence:** brief 176–184, 239–241, 251, 259, 263, 268–271, 299, 314, 322, 327, 329.

The ideal result commits to a shared daemon, quantization, decision caching, numeric candidates and provider lookup while those decisions remain open. The hybrid is said to remove token limits and refresh drift, which its structure does not guarantee. Provider prices can change which model is best value, so choosing a provider after selecting a model requires an equivalent economic contract.

**Required correction:** describe the hybrid's bounded benefit—less candidate text and no explicit name feature—and retain tests for long tasks, changed pools/prices and calibration. Keep process lifetime and quantization as benchmark candidates. Defer decision caching and multi-harness sharing without workload evidence. Preserve input-version consistency, constraint validation and timeouts regardless of packaging. PLAN §6.4 is the comparison to run, not approval to move price handling to code.

### R6. Do not turn evaluation baselines into extra runtime selectors by default

**Evidence:** brief 26, 41, 214, 280–281, 296–298.

The Alternatives section recommends LLM escalation on low confidence and a rules-engine fallback despite choosing B for local selection without per-decision teacher calls. This can create three runtime selectors, add network/privacy/cost behavior and conflict with offline operation before the failure policy is agreed.

**Required decision:** keep C and the rules engine as evaluation comparisons unless their runtime roles are explicitly accepted. Prefer the smallest deterministic eligible fallback sufficient for the chosen failure policy. The historical rules baseline even relaxes a quality floor; it cannot automatically be reused under a hard-constraint guarantee.

### R7. Finish a bounded alternatives and reuse comparison

**Evidence:** brief 134–142, 296–302, 335; PLAN 14–23.

D is rejected without a clear technical rejection trade-off, the hybrid's status is open, and named existing routers remain unexamined while the brief claims gateway routers cannot provide several proposed capabilities. Personal rejection attribution also lacks the decision link required by the feature-spec standard.

**Required correction:** preserve B's accepted choice, state concrete reasons for rejected alternatives, distinguish D from the still-open hybrid, and add a short requirements comparison/reuse inventory. Replace unsupported personal attribution with the design rationale or a decision reference. No exhaustive market study or public posting is necessary. No reusable application implementation was found in this checkout; VPS artifacts were unavailable.

## Nits and document reconciliation

These do not independently overturn the architecture. Their corrections prevent stale prose from being treated as requirements; confidence and logging contradictions are already elevated separately above.

### R8. Make document authority and snapshot publication status consistent

**Evidence:** brief 5, 124, 232, 253, 320, 335; README 19–28, 39–55, 69–75.

Publication is optional in S6 but chosen in Risk 8; redistribution restrictions are asserted while permissions remain an open check. The brief supersedes PLAN but does not explicitly classify the conflicting README as historical. Mark publication pending its decision/checks, establish the brief's precedence and add a reciprocal README pointer. PLAN §6.4 remains normative because the brief explicitly incorporates it.

### R9. Match summaries and numerical estimates to their evidence

**Evidence:** brief 200, 203–204, 240, 243, 319, 346; PLAN 293.

“Pi works fully” exceeds a tested main-session path with an untested subagent mechanism. Claude's limitation should name the tested prompt-submit hook rather than all session-switch mechanisms. CPU latency and labelling budgets lack named hardware/input conditions or teacher/token/price assumptions. Qualify historical spike summaries and either provide assumptions for estimates or leave them pending measurement. Do not turn these unsupported numbers into spending or latency commitments.

### R10. Correct references and shorten repeated rationale

**Evidence:** brief 146, 174, 318–321 and repeated rationale/timing sections.

Change the PLAN single-sequence reference from §4.1 to §3.3. Replace the nonstandard “2a.” ordered-list marker. Drop unsupported commentary about reviewer agreement and shorten repeated rationale to references to authoritative decisions. The actual standard does not require H4 risk headings or exact heading names; the current hierarchy, local links, price-test anchor and tables passed structural checks.

## What improved, and what remains planned

- The purpose of B and the two once-at-start use cases are now clear to fresh readers. This review does not recommend switching to A merely because B has training costs.
- The required price-variation plan isolates prices, updates derived costs, prevents prompt-variant leakage, covers provider price reversals/dominance and separates unseen candidate pools. It appropriately compares learned ranking with code-based scoring.
- Teacher choice, numerical acceptance thresholds, real conversation/subagent outcome data, initial-prompt sufficiency, local inference performance and first-harness integration remain planned decisions/tests. Their absence is disclosed, not evidence that they have failed.
- Stage 8 narrowed proposed security/logging fixes to architectural requirements and rejected unnecessary expansion into new services, production outcome infrastructure or multiple runtime selectors.

## Traceability matrix

| Raw finding IDs | Consolidated item(s) |
|---|---|
| Z5-1, IC5-1, C6-2, D7-1, Z8-1 | R1 |
| C6-1, D7-2, STY7-3, Z8-2 | R2 |
| C6-3, D7-3, STY7-8, Z8-3 | R3 |
| IC5-3, C6-4, STY7-2, Z8-4 | R4 |
| Z5-2, Z5-3, IC5-2, STY7-1, Z8-5 | R5 |
| Z8-6 | R6 |
| Z5-4, STR7-1, STR7-2, STY7-7 | R7 |
| C6-5, STR7-4, STY7-4 | R8 |
| STY7-5, STY7-6 | R9 |
| STR7-5, STR7-6, STY7-9 | R10 |
| STR7-3 | R3, R4, R8 |
| Z8-7 | R7, R8, R9, R10 |

Severity is assessed for the consolidated issue, not decided by reviewer vote. R1 is elevated to Blocker by the design and final zoom-out review. Editorial issues in R8–R10 are narrowed following Z8-7 even where individual critics called them Major. R7 remains Major because the supplied feature-spec standard requires a completed alternatives evaluation; the remedy is deliberately bounded.

## Next step

Resolve R1–R4 as explicit requirement choices, then reconcile the provisional design/alternative statements and document cleanup. Keep B and the one-selection rule unless the author changes them. Define the remaining evaluation thresholds before final testing; proceed to the detailed design draft once these feature-level conflicts are settled. This review does not apply fixes or mark the brief ready for implementation.
