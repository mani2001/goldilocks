# Goldilocks design

Updated 2026-11-16. Read [the product scope](../README.md) first. This document replaces the former concept brief and incremental decision/research notes.

## Selection flow

1. Pi receives an opening user prompt or parent-authored subagent instructions.
2. Plugin code checks the shared evidence cache. When refresh is needed, the execution/parent model follows the Tavily gathering skill. Conversation start needs a bootstrap/default execution model for this step; verify the Pi mechanism during implementation.
3. Build a versioned router payload containing the initial task, preferences, hard constraints and eligible candidate evidence.
4. Invoke the router: initially GPT-6 Astra at high reasoning effort in Pi coding-agent sessions on the user's Codex subscription, with web search for its own research; later Laya, which gets only the payload.
5. Validate candidate identifiers and hard constraints in code. Assemble provider/pricing/latency metadata from the evidence, rather than predicting it.
6. Apply the selected model automatically. Show the choice and alternatives. Keep the choice fixed across later turns, tool calls and compaction.
7. Record decision metadata locally. If explicitly enabled, record separately permitted training examples.

For a new conversation the default model may perform evidence gathering before final selection; ordinary task answering should begin on the selected model. This bootstrap is not a second router. For subagents the parent can gather evidence before spawning. Do not silently switch a running subagent's model.

## Router contract

The exact schema remains to be designed, but teacher and student use the same serializer and input-format version.

| Input | Meaning |
| --- | --- |
| Initial task | Opening conversation prompt or parent-authored subagent instructions |
| Preferences | `quality` and `cost`, each 1–5 |
| Hard requirements | Configured availability, required context length and modality; other explicit hard requirements only when supported |
| Candidates | Token Factory model IDs, capability evidence, input/output prices, context/modality and latency when known |
| Provenance | Source, benchmark/configuration version, observation time, snapshot version and missing fields |

Proposed preference convention: higher quality means stronger emphasis on capability; higher cost means stronger emphasis on saving money, not permission to spend more. Confirm wording before exposing the configuration. No broad configuration framework is needed.

Output is a pick and ordered alternatives, confidence with its target/calibration status, and candidate metadata. Alternatives count and ranking-label format remain open. Prices must include currency and per-token unit; distinguish time-to-first-token, throughput and end-to-end latency. Unknown measurements stay unknown. Explanations can be debug information during teacher development; do not make generative explanations part of Laya's contract without a decision.

## Evidence: Tavily plus a daily local cache

**Selected approach:** the execution/parent model follows skill-defined queries and source instructions to gather evidence using Tavily. Initially investigate Artificial Analysis and Vals. Use Search to locate sources/updates and Extract for known approved pages. Provider catalogue and price information comes from Token Factory's official sources; verify what its API actually supplies.

The cache is local and shared by conversations/subagents. Default TTL is 24 hours, configurable. Plugin code checks freshness; it does not depend on the agent remembering the TTL. Reuse the snapshot on ordinary selections. There is no public GitHub benchmark mirror or scheduled central CI data feed in the selected design.

Operational defaults: coalesce concurrent refreshes; validate extracted values and model/source/benchmark associations; replace the cache atomically only after validation; preserve the last good snapshot on failure and expose its age. Define a maximum stale age and first-install/empty-cache policy during implementation.

Preserve source-specific results and versions before choosing a capability mapping. Match exact checkpoints, reasoning settings and benchmark harnesses to Token Factory candidates. A composite AA/Vals index alone may not distinguish coding, reasoning and tool-use needs. Do not mix benchmark versions or invent missing scores. Measurements from other providers are proxies, not verified Token Factory latency. Do not send private task text in benchmark-discovery queries.

Fetched page content is untrusted evidence. Keep it out of executable instructions; validate the resulting structured evidence. If automated extraction is needed, use a tool-less call isolated from task context, credentials and the active execution agent. Review this boundary when implementing the skill; numeric validation alone does not prevent instructions embedded in pages from affecting a tool-enabled agent.

### Source rights: unresolved, not a permission gate invented by this plan

Runtime search-result use, automated page extraction, local caching, redistribution and training are different activities. Selecting option A does not establish source permission, but neither does this review establish that every downstream use of a Tavily snippet is prohibited. Tavily retrieval itself grants no additional rights to third-party content.

- AA [website terms](https://artificialanalysis.ai/terms-of-use) restrict automated scraping and copying, with a limited search-index exception. Its [Data Platform Terms](https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf), sections 2.4–2.6, address structured-data redistribution, third-party selection products and AI/ML use. Their applicability to the exact runtime retrieval path needs care; do not claim blanket approval or a blanket ban on ordinary search-assisted use.
- A licence for Vals public-leaderboard collection/reuse was not established. [Vals Smith terms](https://www.vals.ai/vals-smith/terms-v1.pdf) concern its customer-specific evaluation service and must not automatically be treated as the public leaderboard's licence.
- Keep source URLs, dates and attribution. Do not publish cached tables, or automatically include unchecked third-party evidence in training exports.

[Tavily Extract documentation](https://docs.tavily.com/documentation/best-practices/best-practices-extract) describes direct retrieval of known URLs. Exact source fields, coverage and permission status remain implementation research, not settled facts.

## Failures and logs

| Condition | Behavior |
| --- | --- |
| Router unavailable, times out or errors | Visible native Pi default as-is; log fallback. Goldilocks does not validate this default against task constraints. |
| Empty eligible pool | Return no selection and report blocking constraints; do not launch an incompatible candidate merely to continue. |
| Malformed router output | One repair attempt within the same deadline, then visible native fallback if still invalid. Never apply an unvalidated pick. |
| Low teacher self-confidence | Do not use an uncalibrated self-report alone to trigger fallback. Final confidence policy remains open. |
| Refresh fails | Preserve last valid snapshot, show age; maximum stale age/empty-cache policy remains open. |
| Provider failure or ignored pick | Surface and log; verify detection/retry behavior in Pi before promising a policy. |
| Log cannot be written | Surface logging failure; do not claim successful logging or block the accepted model-failure fallback. |

Initial teacher-routing timeout: configurable 60 seconds, covering a repair attempt; validate against actual high-effort latency. Evidence refresh needs a separate bounded deadline so repeated selections do not wait indefinitely.

Every attempt/fallback has mandatory local metadata logging: request kind/length, candidate IDs before/after filtering, available probabilities, weights or teacher version, snapshot version/date, latency, pick/fallback and failure reason. No raw prompts, instructions, outputs or transcripts in these logs. Logging does not authorise remote telemetry. Record the actual execution model only if the harness exposes trustworthy evidence; do not claim an applied pick was verified without it.

Training capture is separate, explicit opt-in. Its intended record is exact router input plus teacher output, not the whole execution session. Define source eligibility, retention/deletion, redaction and project exclusions before enabling collection. Input parity must survive any redaction: save the exact payload that actually reached the teacher. Never commit private task data or API keys.

## Confidence and the later decision model

The requested final output includes calibrated confidence. For Laya the agreed target is probability of teacher agreement, not probability of task success. Fit/evaluate calibration after hard filtering on held-out examples. Report calibration error and runner-up recall separately from top-1 agreement; teacher self-reported confidence is not automatically calibrated.

Teacher-stage confidence needs a defined event/protocol; allow an explicitly unavailable/uncalibrated status rather than fabricating a calibrated number. Full rankings versus candidate scores, calibration splits and targets remain open.

Laya input representation is not chosen: compare serialized candidates, task–candidate scoring and task embeddings with numeric candidate features. Check long-task handling, variable pool sizes and version compatibility. The historical checkpoint's 1,024-token limit and laptop inference latency need verification; no CPU performance target is claimed yet.

Teacher selection records the user's choice, not a provider permission determination. The [OpenAI Services Agreement](https://openai.com/policies/services-agreement/) restricts competing-model development and includes a non-distributed classifier exception; applicability to this published narrow router remains unresolved. No permission enquiry has been sent. The user considers this black-box decision-model distillation non-competing; do not rewrite that judgment as provider approval.
