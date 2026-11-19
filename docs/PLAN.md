# Goldilocks delivery plan

Updated 2026-11-18. [README](../README.md) defines scope; [DESIGN](DESIGN.md) defines the current behavior. This replaces the Day 0 timeline, concept brief, review reports and incremental notes. Decisions below do not authorise bulk paid calls or collection of private tasks.

## Foundation: Pi integration with the teacher

- Inspect the current Pi extension APIs for conversation-start model switching, candidate/provider IDs and subagent execution. The historical 2026-11-15 spike reported a working main-input model switch; Pi had no native subagent mechanism in that spike, so the proposed child-process extension was not a verified subagent path. Reverify rather than relying on old versions.
- Run the teacher as GPT-6 Astra at high reasoning effort on the user's **Codex subscription**, in multiple Pi coding-agent sessions with web search enabled. Verify the exact model identifier and session setup. Do not silently substitute direct OpenAI API billing.
- Integrate Token Factory using the user's key; discover configured available candidates. Keep teacher access separate from execution-provider access.
- Define the common router payload/output and preference semantics. Keep configuration to quality 1–5, a dollar rate ceiling and necessary constraints.
- Support both conversation-start and subagent-start selection, apply automatically, pin the chosen model for the task and preserve each subagent's intended tools/instructions.
- Implement validation, bounded timeouts, native fallback and metadata logging.

Completion evidence: demonstrate both paths using actual outgoing model/provider identifiers, not a model's self-report. Verify no selection runs again on ordinary follow-ups or compaction. Check empty pools, invalid picks and teacher failure. No need for product-outcome benchmarking at this stage.

## Foundation: Evidence gathering and caching

- Build the skill's Tavily queries and AA-only source list, then verify completeness on real pages and exact Token Factory model configurations.
- Gather official provider catalogue/prices; keep benchmark scores and endpoint performance provenance separate.
- Implement the shared local cache with a 24-hour default TTL, validation and atomic replacement. Prevent duplicate concurrent refreshes.
- Establish the default-model bootstrap before conversation selection, first-install behavior, stale-data limit and refresh deadline.
- Freeze a versioned evidence schema shared by teacher and future student; mark unknown data explicitly. Resolve source-specific use/capture boundaries before adding content to training exports.

Completion evidence: fresh-cache selections do not call Tavily; expiry triggers a refresh; failed refreshes preserve the previous valid snapshot and expose staleness. Teacher receives the assembled router payload and may also research with web search; Laya receives only the payload.

## Version 0.0.1 delivery phases

### Phase 1. Data cleaning and model inputs

LLMRouterBench is the selected bulk prompt source for training, validation and test. Check the licences of the source datasets and adapt the prompt mix to intended Pi tasks. The old custom 100-task set remains excluded. Plugin examples need a separate decision before inclusion.

Define what goes into the routing payload. Keep the opening task and the context needed to understand it. Exclude archived model responses, answer keys and per-task benchmark scores. Deduplicate tasks and freeze grouped splits before fitting. Keep all variants of a task in the same split.

For repository-based prompts, choose which parts of the repository to represent within the input budget. Compare candidates such as the issue description, a compact directory tree, the README or project instructions, dependency or build manifests, and task-relevant paths, code snippets or test failures. Use only information the plugin can obtain when it routes the opening request. Decide which elements to include, how to select them, and what to do when the budget runs out or repository context is unavailable. Use the same selection and size rules when preparing training examples and routing in Pi.

### Phase 2. Generate labels for Laya

Use the cleaned tasks and the working plugin's routing payload to generate labels with Astra. Confirm the intended teacher path before collecting labels. Use a bounded pilot to settle the teacher prompt, ranking or score format, number of alternatives, tie handling and teacher-stage confidence. Astra can use web search in addition to the routing payload. Laya has access only to the payload. Treat task text and evidence as data.

Enable training capture only through explicit configuration. Define deletion, retention, exclusions and source eligibility. Use the pilot to measure format consistency, repeat agreement, usage and latency. Pilot size and usage cap remain open. The earlier suggestions of 50 tasks, independent CLI runs and mandatory measured-outcome teacher gates remain proposals. Production outcome learning and remote telemetry are outside the release scope.

### Phase 3. Train Laya

First, check that Laya can be fine-tuned on the available training machine: a Windows laptop with an NVIDIA RTX 4060 (8 GB VRAM) and 16 GB RAM. Run a short trial fine-tune at the intended sequence length and batch size, and record peak VRAM, RAM and time per epoch. If it does not fit, decide on reduced settings (smaller batch, gradient accumulation, mixed precision, shorter inputs) or other compute before collecting the full dataset.

Choose the input representation and ranking objective. Fit Laya on the cleaned tasks and Astra's labels. Hide or randomise model identities, shuffle candidate pools and include price variants to discourage memorisation of a single catalogue snapshot. Set the training budget and schedule using the pilot and hardware trial.

### Phase 4. Evaluate Laya

Calibrate against teacher agreement on a separate split after applying the hard filters. Measure top-1 agreement, runner-up recall and calibration on held-out tasks, datasets and candidates. Compare with a feature-based scorer and, where useful, a plain ModernBERT baseline. Benchmark cold and warm local inference on named hardware before choosing precision, runtime and process lifetime. Set numerical acceptance thresholds before final testing.

#### Required price-variation validation

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

For version 0.0.1, Laya must learn to match the teacher’s picks. Numerical agreement/calibration/latency targets remain to be defined; no claim of real task-quality improvement is required to reach this stage.

### Phase 5. Add the trained router to the Pi plugin

Replace the teacher behind the existing router contract. Pin the checkpoint and schema versions, reject incompatible payloads and keep the documented native fallback. Verify conversation and subagent routing, model pinning, preferences and failure behavior through the normal Pi entry points. Publish weights, the model card and eligible data after provenance checks.

### Phase 6. Miscellaneous

Specific items remain open.

## Later evaluation and feedback

Measure completed-task quality, total conversation/subagent cost and latency against sensible defaults/direct teacher selection. Test whether the opening prompt is sufficient when later conversation demands change. Reconsider the 100-task set or realistic subagent/conversation outcomes only in this later phase. A later version can let a user request a model switch mid-session and continue from a summary of work completed so far. Version 0.0.1 keeps the initial selection for the entire task. Other deferred work includes additional harnesses such as OpenCode, additional providers, production outcome learning, safety-aware routing and a demo Space.

## Release numbering

The first release target is `0.0.1`. For subsequent releases, choose the largest applicable change since the last release. Judge the impact on Pi users and router adapter authors.

| Change | Version bump | Example |
| --- | --- | --- |
| Restore documented behavior while preserving compatibility | Patch | Fix a model switch after compaction. |
| Add a compatible capability | Minor | Let the user switch models mid-session. |
| Require existing users or adapter authors to change their config or integration during 0.x | Minor, with migration notes | Make a new router input mandatory. |
| Introduce an incompatible change after reaching 1.0.0 | Major | Remove a supported configuration field. |

Release `1.0.0` when Goldilocks commits to backward compatibility for its configuration and router interface across 1.x minor and patch releases. The release number for mid-session switching depends on when it ships.

Tag the release commit as `vMAJOR.MINOR.PATCH` once it meets its acceptance criteria. Documentation-only corrections do not require a release. Record the router schema version and the Laya checkpoint, when used, for each release. Version them independently. Retraining changes the product version according to its impact on users and integrations.

## Remaining decisions

The product direction is settled; these are not all answered yet:

1. Codex-subscription Pi session setup for the Astra teacher and exact model ID/revision; current Pi hooks and subagent mechanism.
2. Router/evidence schemas, full rankings versus scores, alternatives count, preference wording and missing-evidence behavior.
3. Specific AA/Vals fields and versions, capability mapping, evidence refresh deadline, maximum stale age and empty-cache handling. Source-use/training/publication eligibility is unresolved.
4. Teacher-stage confidence target and eventual calibration method/thresholds. No invented calibrated score in the meantime.
5. Teacher prompt, independent collection strategy, pilot/usage cap, dataset capture exclusions/retention and dataset split policy.
6. Which repository components enter the routing payload and what size budget and selection rules apply.
7. Whether Laya fine-tuning fits the 8 GB RTX 4060 laptop; Laya representation, context-length policy, training/runtime packaging, version rollback and numerical acceptance thresholds.

## Historical evidence and housekeeping

Prior Day 0 documents reported candidate data for OpenRouter, Token Factory and Baseten, a 100-task set, and rules/prompted baselines. The rules baseline reportedly scored 23/100 against hand labels and the prompted Qwen teacher matched its picks on 20 tasks; these are historical reports, not validation of the selected Astra teacher. Referenced VPS candidate JSONs, baseline code and prompts are absent from this checkout. Recover them only if useful; do not treat them as shipped implementation.

Old review documents and rendered diagrams were removed from the working tree because they describe superseded architectures. Git history preserves them. Permission-enquiry drafts were not sent and no longer need to be primary documentation; provider/source findings needed for implementation are retained in DESIGN.
