# Goldilocks

Goldilocks selects the model for a conversation or subagent task from the opening instructions, available models and user preferences. It applies the pick automatically and keeps that model for the rest of the conversation or task.

## Current direction

- **First harness:** Pi, supporting both conversation starts and subagent starts.
- **Build inside out:** make the plugin work with the teacher as its router, then replace the teacher with a local decision model behind the same interface.
- **Teacher:** GPT-6.1 Sol through the user's local Codex API, at **high** reasoning effort. The exact connection must be verified during implementation.
- **Execution models:** Nebius Token Factory, using the user's API key and available catalogue.
- **Decision model:** fine-tuned Laya (`convaiinnovations/laya-typed-decisions`), an encoder-based model that ranks candidates rather than generating answers.
- **Preferences:** quality and cost, each rated 1–5; keep configuration small.
- **Evidence:** the execution/parent model follows a skill to gather AA/Vals information through Tavily. Share a local cache across selections and refresh daily by default.
- **Output:** pick, alternatives, confidence with an accurate calibration status, provider, input/output token prices and latency where known.

## Router versus execution model

The router receives a defined selection payload. Sol and the eventual Laya model must receive exactly the same information: no extra teacher browsing, repository access, hidden history or tools.

The selected execution model is separate. It gets the normal Pi task context, repository access and tools. The initial/default execution model may gather evidence before selection when the cache needs refreshing; the router does not perform that research itself.

## MVP acceptance

For the first decision-model MVP, copying the teacher is sufficient. The numerical agreement threshold remains to be set. Product-outcome evaluation, full-conversation suitability and feedback-driven improvements come later.

Goldilocks selections and alternatives must satisfy hard constraints. If the router fails, Pi continues with its normal default as-is; that accepted fallback is not guaranteed to satisfy Goldilocks constraints. An empty eligible pool returns no selection rather than invoking that fallback.

## Documentation

These three documents are the current source of truth:

1. **README.md:** product scope and settled decisions.
2. **[Design](docs/DESIGN.md):** routing flow, evidence, boundaries and operational behavior.
3. **[Plan](docs/PLAN.md):** delivery stages, validation and remaining decisions.

Status: planning; no runnable plugin, teacher collection or trained decision model is included yet. Earlier plans, reviews, diagrams and research drafts are preserved in Git history, not maintained as competing specifications. No model-quality, cost-saving or latency claims have been validated.
