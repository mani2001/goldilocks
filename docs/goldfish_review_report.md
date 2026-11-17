# Goldfish Annotated Review Report

**Status: resolved — accepted edits applied; open design questions retained.**

The author requested committing these changes with the open questions after the in-chat walkthrough. All 10 suggestions were accepted: 9 required edits in this batch; R6 was already addressed. There are 0 contested, 0 escalated and 0 declined findings. R3 remains partially unaddressed until log retention and the full write-failure contract are decided. Independent re-review has not run.

The affected scopes, target hash and proposed edit instructions below preserve the pre-application resolution packet; they are not current line numbers. The current decisions and 18 open-question entries are in [the live brief](concepts_brief.md#key-decisions--staging-for-next-steps).

**Target:** `docs/concepts_brief.md` (full file, 355 lines).

**Pre-resolution target SHA-256:** `443b5166a8a83291c73879699b9fdf1a0d2ff7bec28ccb12418b1c40f3e207e4`.

**Findings:** [recorded consolidated review](reviews/2026-11-16/consolidated_review_report.md), R1–R10.

**Date:** 2026-11-16.

This is the `egm-resolve` step after stages 5–8, before the detailed design draft. The dated review and its input snapshot remain immutable. Original severities are preserved. Each item has exactly one resolution category; a category is not a claim that work has already been applied or independently verified.

The author has already required mandatory logging and native harness-default fallback as-is on model failure, even when the default violates Goldilocks constraints. Those accepted decisions are preserved and do not need renewed approval. The policy choices below were proposed and then accepted for this documentation update. B, once-at-start selection, and PLAN §6.4's price test remain the direction.

**Applied edit scope:** the live brief, one README authority pointer, and the runtime/component Mermaid diagrams plus their rendered PNGs where specified. No code, dependencies, experiments, paid calls or changes to historical review inputs. The author separately authorised committing this documentation. Cross-references and decided/open lists must reflect approved text consistently. Training diagrams already describe teacher-agreement confidence and need no semantic change.

## Prioritized Findings & AI Suggestions

### R1. Hard constraints must also govern fallback [Consolidated Goldfish reviewers] — Severity: Blocker

- **Affected scope:** live brief 218–237, G2/G6 (Risk 7; hard constraints); original evidence and reviewer IDs remain in the [source report](reviews/2026-11-16/consolidated_review_report.md).
- **Discrepancy description (verbatim):** An empty eligible set can fall back to the parent/default model and still spawn, while G2 says no hard constraint may ever be violated. Invalid requests or corrupt evidence also reach fallback without proving eligibility. At conversation start there may be no parent model at all.
- **Rationale / original requested remedy (verbatim):** **Required decision:** every fallback must pass the same hard constraints. If no eligible choice can be established, return a visible no-selection outcome instead of launching an incompatible model. Qualify “never block a spawn” accordingly. Reuse the existing filter; no new policy service is needed.
- **AI Suggestion:** PROPOSE FIX
- **Justification:** The finding was valid for the reviewed revision. The author's subsequent decision explicitly accepts unconstrained native fallback on model failure; that decision already replaces the reviewer's preferred remedy. Preserve it. The residual empty-pool case is still open, so propose a separate rule rather than expanding the accepted exception.

**Proposed edit — Risk 7; hard constraints:**

Keep the existing native-default paragraph and G2 exception unchanged. Replace “An empty eligible set is a constraint-infeasibility result, not by itself a decision-model failure; its handling remains to be decided.” with:

> An empty eligible set returns a visible no-selection result and identifies the blocking constraints. It does not launch a model or trigger native fallback merely because no candidate is eligible. This differs from decision-model unavailability, runtime error or timeout, which uses the harness default as-is.

In the failure list, change the empty-mask row to “every candidate is removed by the mask: return no selection, log infeasibility, and notify the user.” Update G6 and Decision 11 to point to this rule instead of listing infeasibility as undecided. Missing/corrupt evidence, low confidence and provider errors remain explicit design questions; this proposal does not assign them to native fallback.

Companion diagram: replace the component diagram's mask → response label “Reports infeasibility; handling open” with “Reports no selection and blocking constraints”. Regenerate its PNG after approval.

### R2. Establish the evidence-extraction trust boundary [Consolidated Goldfish reviewers] — Severity: Major

- **Affected scope:** live brief 105–127, 239–245 (S5/S6; Risk 8); original evidence and reviewer IDs remain in the [source report](reviews/2026-11-16/consolidated_review_report.md).
- **Discrepancy description (verbatim):** The harness LLM reads untrusted pages, but the brief claims free text never reaches the model or orchestrator. Validating numbers afterward does not constrain what the extractor can do while reading the page. Plausible values can also be associated with the wrong candidate or benchmark.
- **Rationale / original requested remedy (verbatim):** **Required decision:** name the extractor, its authority and isolation from the active task/parent, and validate source/candidate/benchmark associations as well as numeric values. A tool-less call without task context is one option; structured sources are another possible design direction. This review has not selected the implementation or reproduced an exploit. Keep responsibility within the existing evidence-refresh path.
- **AI Suggestion:** PROPOSE FIX
- **Justification:** A separate, bounded extraction call resolves the contradictory text without adding a service. Numeric range checks alone do not establish correct attribution or isolate untrusted instructions.

**Proposed edit — S5/S6; Risk 8:**

Replace S6's “Cache per URL, convert once per refresh” bullet with:

> **Cache per URL, convert once per refresh.** The evidence-refresh path converts unstructured pages through a separate tool-less extraction call. The call receives only the fetched page, its source identifier, the required schema and candidate identifiers. It receives no conversation/subagent prompt, conversation history, credentials or authority to invoke tools. Fetching code handles credentials outside the model input. This is separate from the active harness conversation and runs once per refresh, not per selection. Structured APIs bypass the extraction model.

Replace S6's final bullet with:

> **Untrusted text stops at extraction.** The extraction model reads page text as untrusted data. Only validated typed features reach the local decision model; page text and extraction instructions do not enter the active conversation or parent agent context. Before accepting an extraction, validate source URL, model/provider identity, benchmark name and version, units, required-field coverage and numeric ranges. Reject ambiguous associations and keep the last valid snapshot on refresh failure.

Make S5 reference these association checks. Replace Risk 8's final bullet with “Use the isolated extraction boundary and validation contract in S6.” In the runtime diagram, label the fetcher “Typed APIs or isolated tool-less extraction; validates source and candidate associations” and the evidence source “Provider APIs and benchmark pages; untrusted input”. Regenerate its PNG after approval. Extractor model choice and hosting remain open; if remote, only the bounded public-page extraction input may leave the machine.

### R3. Choose one consent and content policy for logging [Consolidated Goldfish reviewers] — Severity: Major

- **Affected scope:** live brief 229–237, trade-offs, Decision 10 (Mandatory logging); original evidence and reviewer IDs remain in the [source report](reviews/2026-11-16/consolidated_review_report.md).
- **Discrepancy description (verbatim):** “Log every decision” and “opt-in local logging only” disagree. “Inputs” could include private opening prompts and repository instructions. Collecting production outcomes for later recalibration also extends into a v1 non-goal.
- **Rationale / original requested remedy (verbatim):** **Required decision:** state whether logging is opt-in, whether prompt text is excluded, and basic retention/deletion expectations. The smallest interpretation of the existing non-goal is opt-in records without prompt text unless deliberately enabled. Keep product-evaluation measurement separate from production feedback infrastructure. Do not add logging tiers or access-management machinery merely to resolve the prose.
- **AI Suggestion:** PROPOSE FIX
- **Justification:** Mandatory local logging is an accepted author decision, not a pending opt-in choice. Minimise stored content without creating production feedback infrastructure. Retention and an unwritable sink still require an explicit contract; do not equate attempted logging with a durable record.

**Proposed edit — Mandatory logging:**

Replace “Define raw-prompt inclusion, retention/deletion and log-write-failure behavior before implementation.” with:

> V1 records decision metadata, not raw opening prompts, subagent instructions, model outputs or transcripts. It does not collect production outcomes for automatic learning. The retention/deletion period and behavior when the local log cannot be written remain explicit decisions required before implementation. A failed write must be surfaced and must never be reported as a successfully logged attempt. The accepted model-failure fallback must still let the harness proceed with its default; any unavoidable missing record is a logging failure, not an exemption from mandatory logging.

Replace the input-metadata bullet with “input metadata limited to request kind, input length and candidate identifiers before/after the mask when available; exclude task text and arbitrary user-supplied strings.” Retain the other existing fields. Replace Decision 10's second sentence with “Raw prompts and transcripts are excluded; retention/deletion and log-write-failure handling remain to be specified.” Replace “prompt retention still undecided” in runtime/component diagrams with “metadata only, no task text”.

Replace the labels trade-off row's production-outcome logging sentence with “Measure task outcomes in the explicitly scoped evaluation; production feedback learning remains out of scope.”

**Partial closure:** approval resolves content and consent contradictions, not the retention duration or complete log-failure policy. Do not mark R3 fully closed until those are decided.

### R4. Give confidence one meaning and test runners-up separately [Consolidated Goldfish reviewers] — Severity: Major

- **Affected scope:** live brief 91–92, 159–169, trade-offs, unresolved list (Confidence and runners-up); original evidence and reviewer IDs remain in the [source report](reviews/2026-11-16/consolidated_review_report.md).
- **Discrepancy description (verbatim):** Confidence is alternately accepted as teacher agreement, defined as probability of being near the best cost-adjusted choice, and left unresolved. Those are different events with different labels.
- **Rationale / original requested remedy (verbatim):** **Required decision:** retain teacher agreement consistently or explicitly reopen the definition; mark the epsilon-based objective as an alternative. Do not add another output just to reconcile the text. Specify how runners-up will be evaluated. The final reviewer contests the claim that repeated sampling or full per-candidate teacher scores are inherently necessary for teacher-agreement calibration; treat richer labels as a budgeted experiment rather than a mandatory cost multiplier.
- **AI Suggestion:** PROPOSE FIX
- **Justification:** Keep the already accepted teacher-agreement event. A held-out single teacher choice can support calibration of agreement and top-k recall; it does not establish a complete ordering of runners-up or actual task success.

**Proposed edit — Confidence and runners-up:**

Replace Risk 2's mitigation list with:

> - V1 confidence estimates the probability that the named teacher, under the fixed labelling protocol and the same task, eligible candidates, features and prices, would choose the selected candidate. It does not estimate task success or cost optimality.
> - Fit calibration after the hard-constraint mask using a separate calibration split. Report ECE, Brier score and reliability diagrams; freeze numerical thresholds before final testing. Test calibration on changed prices and held-out pools, and define refresh/recalibration triggers.
> - Evaluate runners-up separately: hard-constraint compliance and top-k recall of the teacher's winner. These metrics do not validate the ordering among non-winners. Use a bounded pilot with ranked teacher preferences or measured outcomes if claiming that ordering is useful; richer labels are an experiment, not a prerequisite for top-1 agreement calibration.

Replace the confidence trade-off cell with “Confidence predicts teacher agreement under the fixed labelling protocol. Near-optimal cost-adjusted choice is a different, unselected target requiring outcome labels. Low-confidence action remains open.” Remove the mandatory “Ask it for scores on every candidate” from the labels row and refer to the bounded pilot above.

Rename the unresolved confidence entry to “Confidence calibration” and replace its text with “Teacher agreement is decided. Define the calibration split, numerical targets, masked-pool evaluation, refresh triggers and runner-up evaluation protocol (Risk 2).” The current training/component diagrams already use teacher-agreement wording.

### R5. Keep the runtime and hybrid design provisional until measured [Consolidated Goldfish reviewers] — Severity: Major

- **Affected scope:** live brief 171–186, 246–250, 259, trade-offs and Ideal Final Result (Provisional runtime and representation); original evidence and reviewer IDs remain in the [source report](reviews/2026-11-16/consolidated_review_report.md).
- **Discrepancy description (verbatim):** The ideal result commits to a shared daemon, quantization, decision caching, numeric candidates and provider lookup while those decisions remain open. The hybrid is said to remove token limits and refresh drift, which its structure does not guarantee. Provider prices can change which model is best value, so choosing a provider after selecting a model requires an equivalent economic contract.
- **Rationale / original requested remedy (verbatim):** **Required correction:** describe the hybrid's bounded benefit—less candidate text and no explicit name feature—and retain tests for long tasks, changed pools/prices and calibration. Keep process lifetime and quantization as benchmark candidates. Defer decision caching and multi-harness sharing without workload evidence. Preserve input-version consistency, constraint validation and timeouts regardless of packaging. PLAN §6.4 is the comparison to run, not approval to move price handling to code.
- **AI Suggestion:** PROPOSE FIX
- **Justification:** The learned engine is selected; its representation and packaging are not. The fix retains the price experiment and removes guarantees that architecture alone cannot provide.

**Proposed edit — Provisional runtime and representation:**

Replace the first Risk 3 mitigation bullet with:

> **Compare a task encoder with numeric candidate features.** Laya would encode the task once and a learned head would score unnamed, normalised candidate vectors. This can reduce candidate text and remove explicit model-name features; task length, pool-size cost, feature shortcuts, unseen candidates and price changes still require tests. Compare it with the text-based forms before choosing the input structure.

Change Risk 3's heading to “The candidate pool changes; name shortcuts and input length need tests.” Change “The model will learn shortcuts” to “The model may learn shortcuts”. Delete “Most review agents named this as their top recommendation.”

Replace Risk 9's suggested setup with “Benchmark a process per call and a resident process, and compare supported full-precision/quantized runtimes on named Apple Silicon and x86 hardware. Measure cold/warm latency, memory and quality before selecting packaging, timeout and target. Defer shared multi-harness daemons and decision caching until a workload justifies them. Pin weights and input-format versions in every option.”

Replace Risk 12's last two sentences with “A model-first/provider-second lookup is an alternative to joint model-provider scoring. It is acceptable only if provider prices, availability and constraints are accounted for when comparing models; otherwise it can change the best-value pick. Compare these designs using PLAN §6.4. Do not assume it halves the pool or removes the need to learn price sensitivity.”

Change the first trade-off row to “Compare text candidates with unnamed numeric features; use counterfactual training and held-out pool/price tests. Input structure remains open.”

In Ideal Final Result, replace the CPU-daemon bullet with “Selection meets a latency target established on named reference hardware; runtime packaging remains open.” Replace the provider-lookup bullet with “Code masks hard constraints; the model/provider representation remains subject to the input-design comparison.” Replace “Adding a model needs no retraining” with “Adding a model requires compatibility and held-out-candidate checks; retraining may be needed”.

### R6. Do not turn evaluation baselines into extra runtime selectors by default [Consolidated Goldfish reviewers] — Severity: Major

- **Affected scope:** live brief Risk 7; Alternatives A/C; G6 (Runtime selectors); original evidence and reviewer IDs remain in the [source report](reviews/2026-11-16/consolidated_review_report.md).
- **Discrepancy description (verbatim):** The Alternatives section recommends LLM escalation on low confidence and a rules-engine fallback despite choosing B for local selection without per-decision teacher calls. This can create three runtime selectors, add network/privacy/cost behavior and conflict with offline operation before the failure policy is agreed.
- **Rationale / original requested remedy (verbatim):** **Required decision:** keep C and the rules engine as evaluation comparisons unless their runtime roles are explicitly accepted. Prefer the smallest deterministic eligible fallback sufficient for the chosen failure policy. The historical rules baseline even relaxes a quality floor; it cannot automatically be reused under a hard-constraint guarantee.
- **AI Suggestion:** PROPOSE FIX
- **Justification:** The finding was valid when issued. The author has since selected the harness default as-is, and the live brief already removes rules/frontier fallback roles. This is completed author-directed remediation, not grounds to contest the original report.

**Proposed edit — Runtime selectors:**

No further target edit. Preserve Risk 7, G6 and Alternatives A/C: rules and frontier selection are evaluation baselines; neither is a runtime fallback. Record this item as addressed by the prior author-directed edits, pending consistency re-review. Do not reintroduce the reviewer's preferred “eligible fallback” over the author's explicit exception.

### R7. Finish a bounded alternatives and reuse comparison [Consolidated Goldfish reviewers] — Severity: Major

- **Affected scope:** live brief 136–144, 303–309 (S8 and Alternatives Weighed); original evidence and reviewer IDs remain in the [source report](reviews/2026-11-16/consolidated_review_report.md).
- **Discrepancy description (verbatim):** D is rejected without a clear technical rejection trade-off, the hybrid's status is open, and named existing routers remain unexamined while the brief claims gateway routers cannot provide several proposed capabilities. Personal rejection attribution also lacks the decision link required by the feature-spec standard.
- **Rationale / original requested remedy (verbatim):** **Required correction:** preserve B's accepted choice, state concrete reasons for rejected alternatives, distinguish D from the still-open hybrid, and add a short requirements comparison/reuse inventory. Replace unsupported personal attribution with the design rationale or a decision reference. No exhaustive market study or public posting is necessary. No reusable application implementation was found in this checkout; VPS artifacts were unavailable.
- **AI Suggestion:** PROPOSE FIX
- **Justification:** The current official documentation overlaps substantially with the proposed capabilities. Local deployment, constraints or agent integration cannot be claimed as categorically unique. This bounded documentation comparison supports reuse investigation, not adopting a dependency or changing B.

**Proposed edit — S8 and Alternatives Weighed:**

Replace S8's verdict, list and unverified paragraph with:

> Goldilocks targets a specific combination: local fine-tuned Laya selection from the opening prompt, a fixed model for the conversation or subagent task, hard constraints on Goldilocks picks, and teacher-agreement confidence with runners-up. These are requirements to validate, not proven unique capabilities. Existing routers overlap; the bounded comparison below identifies useful baselines and integration candidates. No tool was installed or benchmarked for this comparison.

Replace the “Existing routers … Not yet weighed” bullet with this table and conclusion (official documentation checked 2026-11-16):

| Option | Documented overlap | Goldilocks fit and possible reuse |
|---|---|---|
| [OpenRouter Auto Router](https://openrouter.ai/docs/guides/routing/routers/auto-router) | Hosted per-request model/effort selection, allowed-model and provider restrictions, prices and benchmarks; can change models on later turns. | Useful hosted comparison. Its documented request path differs from local, once-at-start selection. Do not claim it lacks constraints or benchmark inputs. |
| [Not Diamond](https://docs.notdiamond.ai/docs/what-is-model-routing) | Pretrained and custom routers; quality/cost/latency trade-offs over candidate models. | Useful custom-router comparison. The overview alone does not establish local offline operation or Goldilocks confidence semantics; those remain unverified, not unsupported capabilities. |
| [RouteLLM](https://github.com/lm-sys/RouteLLM) | Open-source serving/evaluation framework, strong/weak-model routing and multiple provider support. Its README notes remote embeddings for some routers. | Evaluation and provider integration may be reusable. The documented two-model threshold design differs from dynamic model-provider ranking; offline suitability depends on the router. |
| [LiteLLM Auto Router](https://docs.litellm.ai/docs/auto_router/) | Configurable model tiers, classifier/rule routing, and documented connections to decision models including Laya. | Strong integration candidate to inspect before writing provider plumbing. Once-at-start pinning and the exact confidence/runners-up contract still require verification. |

> Keep B as the selected learning approach. Reuse serving, adapters or evaluation code where compatible; this comparison does not prove that a new routing stack is necessary, nor that these tools already meet the complete contract. No reusable application implementation has been verified in this checkout; referenced VPS artifacts remain unavailable.

For A and C, replace “Rejected by author in favour of B” with “Not selected for v1; retained as an evaluation baseline” and retain their explicit trade-offs. Replace the D bullet with:

> **D. Encoder maps task to capability needs; a separate ranker scores candidate features.** Not selected as a separate v1 architecture. Its explicit capability-needs intermediate differs from a B variant that directly learns scores from a task embedding plus numeric candidate features. The record does not supply a technical rejection rationale for that B variant; compare representations under Risk 3 rather than declaring the hybrid rejected or guaranteed to solve drift.

For live search and the custom 100-task set, replace unsupported personal rejection attribution with “Not selected” and retain the documented cache rationale and data-source decision. This does not reopen B or silently restore the discarded dataset.

### R8. Make document authority and snapshot publication status consistent [Consolidated Goldfish reviewers] — Severity: Nit

- **Affected scope:** live brief 5, 126, 239, 261; README (Authority, publication and licensing); original evidence and reviewer IDs remain in the [source report](reviews/2026-11-16/consolidated_review_report.md).
- **Discrepancy description (verbatim):** Publication is optional in S6 but chosen in Risk 8; redistribution restrictions are asserted while permissions remain an open check. The brief supersedes PLAN but does not explicitly classify the conflicting README as historical. Mark publication pending its decision/checks, establish the brief's precedence and add a reciprocal README pointer. PLAN §6.4 remains normative because the brief explicitly incorporates it.
- **Rationale / original requested remedy (verbatim):** Publication is optional in S6 but chosen in Risk 8; redistribution restrictions are asserted while permissions remain an open check. The brief supersedes PLAN but does not explicitly classify the conflicting README as historical. Mark publication pending its decision/checks, establish the brief's precedence and add a reciprocal README pointer. PLAN §6.4 remains normative because the brief explicitly incorporates it.
- **AI Suggestion:** PROPOSE FIX
- **Justification:** A precedence pointer and consistent pending status prevent stale documents from silently becoming requirements. No licence conclusions are established by this resolution.

**Proposed edit — Authority, publication and licensing:**

Replace the base-document line with:

> * **Document authority:** This brief supersedes conflicting content in `PLAN.md` and `../README.md`. PLAN §6.4 remains normative because this brief explicitly incorporates its price-variation test. Historical review snapshots preserve the earlier state.

Add immediately below the README title:

> **Design status:** The current [concept brief](docs/concepts_brief.md) supersedes conflicting design statements here. [PLAN §6.4](docs/PLAN.md#64-price-variation-test-added-2026-11-16-required-before-release) remains the required price-variation plan.

Replace Risk 8's heading with “Making `results.json` refresh reliably. S4–S6 chose a cached JSON refresh path; source coverage and publication remain subject to validation.” Replace Risk 13's paragraph with “Check the licences and provenance of the LLMRouterBench source datasets and the terms for extracting and redistributing each evidence source, including Artificial Analysis. Record the results in a data card before publication. A published evidence snapshot is optional and not approved until the relevant permissions are established.”

### R9. Match summaries and numerical estimates to their evidence [Consolidated Goldfish reviewers] — Severity: Nit

- **Affected scope:** live brief Risk 5, Risk 9, Risk 10, final comparison table (Evidence-limited claims); original evidence and reviewer IDs remain in the [source report](reviews/2026-11-16/consolidated_review_report.md).
- **Discrepancy description (verbatim):** “Pi works fully” exceeds a tested main-session path with an untested subagent mechanism. Claude's limitation should name the tested prompt-submit hook rather than all session-switch mechanisms. CPU latency and labelling budgets lack named hardware/input conditions or teacher/token/price assumptions. Qualify historical spike summaries and either provide assumptions for estimates or leave them pending measurement. Do not turn these unsupported numbers into spending or latency commitments.
- **Rationale / original requested remedy (verbatim):** “Pi works fully” exceeds a tested main-session path with an untested subagent mechanism. Claude's limitation should name the tested prompt-submit hook rather than all session-switch mechanisms. CPU latency and labelling budgets lack named hardware/input conditions or teacher/token/price assumptions. Qualify historical spike summaries and either provide assumptions for estimates or leave them pending measurement. Do not turn these unsupported numbers into spending or latency commitments.
- **AI Suggestion:** PROPOSE FIX
- **Justification:** Historical spike results must retain their tested boundary. Latency and spending figures without assumptions should not be commitments.

**Proposed edit — Evidence-limited claims:**

In Risk 5, replace “Pi works fully but needs its own subagent tool” with “Pi's main-session path was tested; its proposed subagent path needs its own tool and an end-to-end test.” Replace the Claude conclusion “cannot switch the main session's model” with “the tested UserPromptSubmit path could not switch the live session model”. In the detailed Claude paragraph, replace the text from “So ‘the model is not loaded…” through its launcher conclusion with “The tested prompt-submit hook did not change the live session model. A launcher selecting before process start or an explicit user model switch are candidate paths; this spike does not rule out all other switching mechanisms.”

Replace Risk 9's first bullet with “CPU latency, memory and installation footprint are unmeasured for the intended runtime. Specify hardware, precision, task length, candidate count and cold/warm conditions before quoting performance.”

Replace Risk 10 with:

> **10. The frontier-teacher labelling budget must be calculated.** The historical Qwen estimate does not establish the cost of the selected frontier teacher or the larger training scope. Estimate prompts × profiles × variants × samples × input/output tokens at named teacher/provider prices, with retries and pilot costs separate. Select the teacher and a hard spending cap before bulk labelling; use a bounded pilot and a learning curve to decide whether more labels are worthwhile. No spend is authorised by this estimate.

Replace the final comparison table's “roughly $280–560 per pass” text with “Re-estimate after selecting the teacher, token assumptions, profile/variant counts and spending cap.”

### R10. Correct references and shorten repeated rationale [Consolidated Goldfish reviewers] — Severity: Nit

- **Affected scope:** live brief 148, 176, unresolved list (References and repetition); original evidence and reviewer IDs remain in the [source report](reviews/2026-11-16/consolidated_review_report.md).
- **Discrepancy description (verbatim):** Change the PLAN single-sequence reference from §4.1 to §3.3. Replace the nonstandard “2a.” ordered-list marker. Drop unsupported commentary about reviewer agreement and shorten repeated rationale to references to authoritative decisions. The actual standard does not require H4 risk headings or exact heading names; the current hierarchy, local links, price-test anchor and tables passed structural checks.
- **Rationale / original requested remedy (verbatim):** Change the PLAN single-sequence reference from §4.1 to §3.3. Replace the nonstandard “2a.” ordered-list marker. Drop unsupported commentary about reviewer agreement and shorten repeated rationale to references to authoritative decisions. The actual standard does not require H4 risk headings or exact heading names; the current hierarchy, local links, price-test anchor and tables passed structural checks.
- **AI Suggestion:** PROPOSE FIX
- **Justification:** These small repairs are useful to human readers and do not need a structural rewrite.

**Proposed edit — References and repetition:**

Change the Risk 3 reference from “§4.1 reads all candidates in one sequence” to “§3.3 reads all candidates in one sequence”. Delete “The review agents agreed with each other more than usual.” Replace the remainder of that introductory paragraph with “The risks below distinguish accepted requirements from untested assumptions about labels, harness integration, local runtime and changing candidate pools.” Renumber the entire “To resolve before /egm-draft” list sequentially, turning `2a.` into an ordinary numbered item. Keep S3 as the rationale reference; do not add another rationale summary.

## Resolution state and next handoff

- All 10 suggestions accepted; 9 applied as new edits, R6 already addressed. No contests, escalations or declined items. This resolves the resolution workflow, not every design question or the independent review verdict.
- R3 is partial: mandatory metadata-only logging is decided; retention/deletion and the full log-write-failure contract remain open. R1's fallback exception and empty-pool behavior are documented, while other failure-table cases remain open.
- The [live brief's open-question ledger](concepts_brief.md#key-decisions--staging-for-next-steps) retains 18 entries: product evaluation; teacher/pilot/budget; evidence licensing; calibration and runners-up; input representation; memorisation tests; prompt mix/splits; constraint schema; task-cost formula; provider semantics; first harness; runtime; remaining failures/log policy; evidence contract; versioning; economics; thresholds; and artifact/README housekeeping.
- The updated brief and affected diagrams need independent re-review before claiming the findings are verified closed. No detailed design draft or implementation-ready verdict is produced by this commit.
