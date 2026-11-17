# Goldilocks delivery plan

Updated 2026-11-16. [README](../README.md) defines scope; [DESIGN](DESIGN.md) defines the current behavior. This replaces the Day 0 timeline, concept brief, review reports and incremental notes. Decisions below do not authorise bulk paid calls or collection of private tasks.

## 1. Build the Pi integration with the teacher

- Inspect the current Pi extension APIs for conversation-start model switching, candidate/provider IDs and subagent execution. The historical 2026-11-15 spike reported a working main-input model switch; Pi had no native subagent mechanism in that spike, so the proposed child-process extension was not a verified subagent path. Reverify rather than relying on old versions.
- Identify the user's **local Codex API** endpoint/protocol/authentication and executable Sol identifier. Use GPT-6.1 Sol at high effort. Do not silently substitute direct OpenAI API billing or Codex CLI.
- Integrate Token Factory using the user's key; discover configured available candidates. Keep teacher access separate from execution-provider access.
- Define the common router payload/output and preference semantics. Keep configuration to quality/cost 1–5 and necessary constraints.
- Support both conversation-start and subagent-start selection, apply automatically, pin the chosen model for the task and preserve each subagent's intended tools/instructions.
- Implement validation, bounded timeouts, native fallback and metadata logging.

Completion evidence: demonstrate both paths using actual outgoing model/provider identifiers, not a model's self-report. Verify no selection runs again on ordinary follow-ups or compaction. Check empty pools, invalid picks and teacher failure. No need for product-outcome benchmarking at this stage.

## 2. Integrate evidence gathering and caching

- Build the skill's Tavily queries and AA/Vals source list, then verify completeness on real pages and exact Token Factory model configurations.
- Gather official provider catalogue/prices; keep benchmark scores and endpoint performance provenance separate.
- Implement the shared local cache with a 24-hour default TTL, validation and atomic replacement. Prevent duplicate concurrent refreshes.
- Establish the default-model bootstrap before conversation selection, first-install behavior, stale-data limit and refresh deadline.
- Freeze a versioned evidence schema shared by teacher and future student; mark unknown data explicitly. Resolve source-specific use/capture boundaries before adding content to training exports.

Completion evidence: fresh-cache selections do not call Tavily; expiry triggers a refresh; failed refreshes preserve the previous valid snapshot and expose staleness. Teacher receives only the assembled router payload, without hidden research access.

## 3. Stabilise labels and explicitly enabled capture

Use the working plugin to discover the required label format before bulk collection. Teacher prompt, full ranking versus per-candidate scores, alternatives count, tie handling and teacher-stage confidence remain to be designed. Teacher sees exactly what Laya will see; task text/evidence is data, not instructions to execute.

Enable training recording only through explicit configuration. Define deletion/retention, exclusions and source eligibility. No production outcome-learning system or remote telemetry is in scope. Use a bounded pilot to measure format consistency, usage and latency; pilot size and usage cap are not fixed. Earlier suggestions of 50 tasks, independent CLI runs or mandatory measured-outcome teacher gates were proposals, not accepted requirements.

## 4. Train and replace the teacher with Laya

LLMRouterBench is the selected bulk prompt source for train/validation/test; check source licences and adapt the prompt mix to intended tasks. The old custom 100-task set remains excluded. Plugin examples are a proposed additional source only after their use/splitting is explicitly designed; do not silently override the LLMRouterBench-only bulk-data decision.

Choose input representation and ranking objective; verify Laya versus plain ModernBERT/feature-based baselines as useful comparisons. Hide/randomise model identities, shuffle pools and use counterfactual price examples to discourage snapshot memorisation. Freeze grouped data splits before fitting. No old fixed candidate/price table, training cost or three-day delivery estimate remains authoritative.

Fit calibration against teacher agreement on a separate split after hard masking; assess held-out prompts, datasets and candidates, top-1 agreement and runner-up recall. Exact metrics/thresholds and training compute are still to be set. Benchmark cold/warm local runtime on named hardware before selecting process lifetime, precision, ONNX/PyTorch or a latency target. No daemon/caching abstraction is required without measurements.

Replace the teacher implementation behind the same router contract. Pin model and schema versions, refuse incompatible payloads, and retain the accepted native fallback. Publish weights/model card and eligible data only after provenance checks.

### Required price-variation validation

Preserved from the former PLAN §6.4; this tests copying/adaptation, not real-world task success.

Freeze the trained student, base task and non-price features, including token estimates. Change input/output prices, recompute derived cost features and obtain fresh teacher choices. Compare the student and a code-based scorer on the same information without retraining/recalibrating between variants.

| Scenario | Check |
| --- | --- |
| Price increases/discounts | Changed and appropriately unchanged winners |
| Input versus output prices | Input-heavy and output-heavy tasks with fixed token estimates |
| Provider price reversal | Final model/provider choice; future multi-provider test once multiple providers are supported |
| Dominance controls | Identical non-price features: never choose strictly higher estimated cost; handle ties consistently |
| Held-out pools | Unseen candidate identities/combinations, reported separately from price-only changes |

Keep all variants of each base task in one split. Hold out price ranges/pools; freeze teacher version, prompt, tie policy and acceptance thresholds before final testing. Record ambiguous/unstable teacher choices. Require zero hard-constraint violations for Goldilocks picks and zero higher-cost choices in controlled dominance cases. Report changed-winner and unchanged-winner agreement separately, plus selection latency. Native failure fallback is the documented constraint exception, not a validated router pick.

For the first DM MVP, copying the teacher is good enough. Numerical agreement/calibration/latency targets remain to be defined; no claim of real task-quality improvement is required to reach this stage.

## 5. Later evaluation and feedback

Measure completed-task quality, total conversation/subagent cost and latency against sensible defaults/direct teacher selection. Test whether the opening prompt is sufficient when later conversation demands change. Reconsider the 100-task set or realistic subagent/conversation outcomes only in this later phase. Production outcome learning, more harnesses/providers, safety-aware routing, mid-session selection and a demo Space are deferred.

## Remaining decisions

The product direction is settled; these are not all answered yet:

1. Local Codex connection and exact model ID/revision; current Pi hooks and subagent mechanism.
2. Router/evidence schemas, full rankings versus scores, alternatives count, preference wording and missing-evidence behavior.
3. Specific AA/Vals fields and versions, capability mapping, evidence refresh deadline, maximum stale age and empty-cache handling. Source-use/training/publication eligibility is unresolved.
4. Teacher-stage confidence target and eventual calibration method/thresholds. No invented calibrated score in the meantime.
5. Teacher prompt, independent collection strategy, pilot/usage cap, dataset capture exclusions/retention and dataset split policy.
6. Laya representation, context-length policy, training/runtime packaging, version rollback and numerical acceptance thresholds.

## Historical evidence and housekeeping

Prior Day 0 documents reported candidate data for OpenRouter, Token Factory and Baseten, a 100-task set, and rules/prompted baselines. The rules baseline reportedly scored 23/100 against hand labels and the prompted Qwen teacher matched its picks on 20 tasks; these are historical reports, not validation of the selected Sol router. Referenced VPS candidate JSONs, baseline code and prompts are absent from this checkout. Recover them only if useful; do not treat them as shipped implementation.

Old review documents and rendered diagrams were removed from the working tree because they describe superseded architectures. Git history preserves them. Permission-enquiry drafts were not sent and no longer need to be primary documentation; provider/source findings needed for implementation are retained in DESIGN.
