# Goldilocks design

Updated 2026-11-18. Read [the product scope](../README.md) first. This document replaces the former concept brief and incremental decision/research notes.

## Version 0.0.1 selection flow

1. Pi receives an opening user prompt or parent-authored subagent instructions.
2. Plugin code checks the shared evidence cache. The extension executes the skill's fixed Tavily retrieval procedure in code when stale, without an extra execution-model reasoning loop or browsing by the router. One-time URL discovery is an explicit setup command.
3. Build a versioned router payload containing the initial task, preferences, hard constraints and eligible candidate evidence.
4. Invoke the router: initially GPT-6 Astra at high reasoning effort in Pi coding-agent sessions on the user's Codex subscription, with web search for its own research; later Laya, which gets only the payload.
5. Validate candidate identifiers and hard constraints in code. Assemble provider/pricing/latency metadata from the evidence, rather than predicting it.
6. Apply the selected model automatically. Show the choice and alternatives. Keep the choice fixed across later turns, tool calls and compaction.
7. Record decision metadata locally. If explicitly enabled, record separately permitted training examples.

For a new conversation evidence refresh runs before the first execution-model request. For subagents the same shared cache is used before the child starts. Do not silently switch a running subagent's model.

## Router contract

The implemented schema is `goldilocks-v2` in `src/router.ts`. It is the teacher/student boundary; eventual Laya input representation still needs design.

| Input | Meaning |
| --- | --- |
| Initial task | Opening conversation prompt or parent-authored subagent instructions |
| Preferences | `quality` 1–5; optional `maxCostPerMillionTokens` in USD |
| Hard requirements | Configured availability, required context length and modality; other explicit hard requirements only when supported |
| Candidates | Token Factory model IDs, capability evidence, input/output prices, context/modality and latency when known |
| Provenance | Source, benchmark/configuration version, observation time, snapshot version and missing fields |

Quality is an integer 1–5: 1 = economical/adequate, 3 = balanced, 5 = strongest task capability within the price ceiling. Cost is not a rating. Optional `maxCostPerMillionTokens` is a nonnegative USD ceiling on the fixed 50% uncached input + 50% output catalogue rate. Null means no ceiling. Code removes over-budget or unpriced candidates before ranking; all alternatives satisfy the same ceiling. This is a comparison rate, not a per-task budget or prediction of the actual input/output mix. All persistent settings are commented in `goldilocks.config.ts`.

Status reports current/selected model price rates with currency/units and sums recorded Token Factory assistant-message usage on the current conversation branch. Historical Pi costs are retained rather than repricing old responses; missing usage stays unknown and catalogue estimates are not labelled invoices. Router and child-session costs are excluded explicitly. The launcher does not force the teacher model on a resumed session.

Output is a pick and ordered alternatives, confidence with its target/calibration status, and candidate metadata. The teacher returns a pick plus up to two alternatives as an ordered ID list and short reasons; identifiers and constraints are validated before use. Prices must include currency and per-token unit; distinguish time-to-first-token, throughput and end-to-end latency. Unknown measurements stay unknown. Explanations can be debug information during teacher development; do not make generative explanations part of Laya's contract without a decision.

## Evidence: Tavily plus a daily local cache

**Current scope:** Token Factory and Artificial Analysis only. The evidence skill defines the retrieval procedure; `src/evidence.ts` executes fixed Tavily calls in code, avoiding repeated agent tool loops. Use Search to locate sources/updates and Extract for known approved pages. Provider catalogue and price information comes from Token Factory's official sources; verify what its API actually supplies.

The cache is local and shared by conversations/subagents. Default TTL is 24 hours. Plugin code checks freshness; it does not depend on the agent remembering the TTL. Reuse the snapshot on ordinary selections. There is no public GitHub benchmark mirror or scheduled central CI data feed in the selected design.

Operational defaults: coalesce concurrent refreshes; validate extracted values and model/source/benchmark associations; replace the cache atomically only after validation; preserve the last good snapshot on failure and expose its age. Implemented maximum stale age is seven days with a visible warning. Empty or older caches that cannot refresh cause a visible native fallback. Fresh caches make no network calls. Cross-process lock files coalesce refreshes; abandoned locks expire after 15 minutes.

Preserve source-specific results and versions before choosing a capability mapping. Match exact checkpoints, reasoning settings and benchmark harnesses to Token Factory candidates. A composite AA index alone may not distinguish coding, reasoning and tool-use needs. Do not mix benchmark versions or invent missing scores. Measurements from other providers are proxies, not verified Token Factory latency. Do not send private task text in benchmark-discovery queries.

Fetched page content is untrusted evidence. Keep it out of executable instructions; validate the resulting structured evidence. If automated extraction is needed, use a tool-less call isolated from task context, credentials and the active execution agent. Review this boundary when implementing the skill; numeric validation alone does not prevent instructions embedded in pages from affecting a tool-enabled agent.

### Source rights: unresolved, not a permission gate invented by this plan

Runtime search-result use, automated page extraction, local caching, redistribution and training are different activities. Selecting option A does not establish source permission, but neither does this review establish that every downstream use of a Tavily snippet is prohibited. Tavily retrieval itself grants no additional rights to third-party content.

- AA [website terms](https://artificialanalysis.ai/terms-of-use) restrict automated scraping and copying, with a limited search-index exception. Its [Data Platform Terms](https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf), sections 2.4–2.6, address structured-data redistribution, third-party selection products and AI/ML use. Their applicability to the exact runtime retrieval path needs care; do not claim blanket approval or a blanket ban on ordinary search-assisted use.
- A licence for Vals public-leaderboard collection/reuse was not established. [Vals Smith terms](https://www.vals.ai/vals-smith/terms-v1.pdf) concern its customer-specific evaluation service and must not automatically be treated as the public leaderboard's licence.
- Keep source URLs, dates and attribution. Do not publish cached tables, or automatically include unchecked third-party evidence in training exports.

[Tavily Extract documentation](https://docs.tavily.com/documentation/best-practices/best-practices-extract) describes direct retrieval of known URLs. Full page content is cached rather than scraped numeric features; exact coverage and source-use status are not assumed exhaustive or approved.

## Failures and logs

| Condition | Behavior |
| --- | --- |
| Router unavailable, times out or errors | Visible native Pi default as-is; log fallback. Goldilocks does not validate this default against task constraints. |
| Empty eligible pool | Return no selection and report blocking constraints; do not launch an incompatible candidate merely to continue. |
| Malformed router output | One repair attempt within the same deadline, then visible native fallback if still invalid. Never apply an unvalidated pick. |
| Low teacher self-confidence | Do not use an uncalibrated self-report alone to trigger fallback. Final confidence policy remains open. |
| Refresh fails | Preserve last valid snapshot and show age for up to seven days; otherwise visible native fallback. |
| Provider failure or ignored pick | Surface and log; verify detection/retry behavior in Pi before promising a policy. |
| Log cannot be written | Surface logging failure; do not claim successful logging or block the accepted model-failure fallback. |

Initial teacher-routing timeout: configurable 60 seconds, covering a repair attempt; validate against actual high-effort latency. Evidence calls have bounded per-call deadlines and a four-minute lock-wait limit.

Every attempt/fallback has mandatory local metadata logging: request kind/length, candidate IDs before/after filtering, available probabilities, weights or teacher version, snapshot version/date, latency, pick/fallback and failure reason. No raw prompts, instructions, outputs or transcripts in these logs. Logging does not authorise remote telemetry. Record the actual execution model only if the harness exposes trustworthy evidence; do not claim an applied pick was verified without it.

Training capture is separate, explicit opt-in. Its intended record is exact router input plus teacher output, not the whole execution session. Define source eligibility, retention/deletion, redaction and project exclusions before enabling collection. Input parity must survive any redaction: save the exact payload that actually reached the teacher. Never commit private task data or API keys.

## Confidence and the later decision model

The requested final output includes calibrated confidence. For Laya the agreed target is probability of teacher agreement, not probability of task success. Fit/evaluate calibration after hard filtering on held-out examples. Report calibration error and runner-up recall separately from top-1 agreement; teacher self-reported confidence is not automatically calibrated.

Teacher-stage confidence needs a defined event/protocol; allow an explicitly unavailable/uncalibrated status rather than fabricating a calibrated number. Teacher-stage output is an ordered top-three ranking with reasons. Calibration splits and targets remain open; confidence is currently null with an explicit uncalibrated status.

Laya input representation is still open. Compare serialized candidates, task–candidate scoring and task embeddings with numeric candidate features. For repository-based tasks, the routing payload will contain selected repository context within a size budget. Phase 1 will decide which components to include and use the same selection rules for training examples and live routing. Check long-task handling, variable pool sizes and version compatibility. Verify the historical checkpoint's 1,024-token limit and measure laptop inference latency before setting a CPU performance target. [Phase 1 plan](PLAN.md#phase-1-data-cleaning-and-model-inputs)

Teacher selection records the user's choice, not a provider permission determination. The [OpenAI Services Agreement](https://openai.com/policies/services-agreement/) restricts competing-model development and includes a non-distributed classifier exception; applicability to this published narrow router remains unresolved. No permission enquiry has been sent. The user considers this black-box decision-model distillation non-competing; do not rewrite that judgment as provider approval.

## Implementation checks (2026-11-18)

Pi 1.5.2 exposes the configured registry's `streamSimple` for a tool-less Sol call and `setModel` for the execution session. The plugin persists selection metadata in Pi's session branch, skips existing conversations and keeps the model on follow-ups and extension reload, checking persisted state even when an SDK host omits the startup event. `goldilocks_subagent` creates an in-memory SDK session, limits built-in tools to the parent's active subset and leaves the parent's model unchanged. It has no extension recursion and carries the execution system context, while its router receives only the explicit selection payload. No standalone Codex endpoint is needed.

Tavily Crawl returned one landing page; extracting AA evaluation and index directories completed a 53-URL inventory. Full Extract results are cached, including source date and SHA-256 per page. This is discovered coverage, not a claim that every AA page was crawled. The shared payload includes up to six complete pages within 180,000 characters, plus omitted-URL metadata, not all 53 pages on every call. Future DM representation/context-length work must account for this payload size.
