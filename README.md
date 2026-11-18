# Goldilocks

Goldilocks selects the model for a conversation or subagent task from the opening instructions, available models and user preferences. It applies the pick automatically and keeps that model for the rest of the conversation or task.

Version 0.0.1 targets Pi. A later version can support a user-requested model switch during a session, with a summary of completed work for the incoming model.

## Current direction

- **First harness:** Pi, supporting both conversation starts and subagent starts.
- **Build inside out:** make the plugin work with the teacher as its router, then replace the teacher with a local decision model behind the same interface.
- **Teacher:** GPT-6 Astra on the user's Codex subscription, at **high** reasoning effort, run in multiple Pi coding-agent sessions with web search enabled so it can research candidates before picking. The exact session setup must be verified during implementation.
- **Execution models:** Nebius Token Factory, using the user's API key and available catalogue.
- **Decision model:** fine-tuned Laya (`convaiinnovations/laya-typed-decisions`), an encoder-based model that ranks candidates rather than generating answers.
- **Preferences:** quality and cost, each rated 1–5; keep configuration small.
- **Evidence:** the execution/parent model follows a skill to gather AA/Vals information through Tavily. Share a local cache across selections and refresh daily by default.
- **Output:** pick, alternatives, confidence with an accurate calibration status, provider, input/output token prices and latency where known.

## Router versus execution model

The router receives a defined selection payload. The teacher (Astra) also has web search and may research beyond that payload; the eventual Laya model receives only the payload. Laya therefore learns to copy picks that may rest on facts it does not see.

The selected execution model is separate. It gets the normal Pi task context, repository access and tools. The initial/default execution model may gather evidence before selection when the cache needs refreshing; Laya does not perform that research; the teacher may do its own.

## Version 0.0.1 acceptance

For version 0.0.1, Laya must learn to match the teacher’s picks. The numerical agreement threshold remains to be set. Product-outcome evaluation, full-conversation suitability and feedback-driven improvements come later.

Goldilocks selections and alternatives must satisfy hard constraints. If the router fails, Pi continues with its normal default as-is; that accepted fallback is not guaranteed to satisfy Goldilocks constraints. An empty eligible pool returns no selection rather than invoking that fallback.

## Documentation

These documents are the current source of truth:

1. **README.md:** product scope and settled decisions.
2. **[Design](docs/DESIGN.md):** routing flow, evidence, boundaries and operational behavior.
3. **[Plan](docs/PLAN.md):** delivery stages, validation and remaining decisions.
4. **[Decisions](.agent/learning/decisions.yml):** the numbered ledger of approved decisions. A newer entry supersedes the older one it names.
5. **[Rules](.agent/rules.yml):** working rules for agents, each citing the decision that approved it. Proposed rules wait in [candidates](.agent/learning/candidates.yml) until approved.

For coding agents: read [AGENTS.md](AGENTS.md) (also linked as `CLAUDE.md`) for the preferred skills, how to record decisions and the git workflow. Changes go through pull requests using [the PR template](.github/pull_request_template.md); nobody pushes directly to `main`.

Status: planning; no runnable plugin, teacher collection or trained decision model is included yet. Earlier plans, reviews, diagrams and research drafts are preserved in Git history, not maintained as competing specifications. No model-quality, cost-saving or latency claims have been validated.
