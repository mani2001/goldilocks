# Goldilocks

Goldilocks selects the model for a conversation or subagent task from the opening instructions, available models and user preferences. It applies the pick automatically and keeps that model for the rest of the conversation or task.

Version 0.0.1 targets Pi. A later version can support a user-requested model switch during a session, with a summary of completed work for the incoming model.

## Current direction

- **First harness:** Pi, supporting both conversation starts and subagent starts.
- **Build inside out:** make the plugin work with the teacher as its router, then replace the teacher with a local decision model behind the same interface.
- **Teacher:** GPT-6 Astra on the user's Codex subscription, at **high** reasoning effort, run in multiple Pi coding-agent sessions with web search enabled so it can research candidates before picking. The exact session setup must be verified during implementation.
- **Execution models:** Nebius Token Factory, using the user's API key and available catalogue.
- **Decision model:** fine-tuned Laya (`convaiinnovations/laya-typed-decisions`), an encoder-based model that ranks candidates rather than generating answers.
- **Preferences:** quality rated 1–5, plus an optional dollar ceiling per million tokens. No cost rating.
- **Evidence:** Artificial Analysis only, retrieved with Tavily. A one-time crawl and directory extraction discover URLs; full pages are cached locally and refreshed with Extract every 24 hours. Token Factory supplies model metadata and prices.
- **Output:** pick, alternatives, confidence with an accurate calibration status, provider, input/output token prices and latency where known.

## Router versus execution model

The router receives a defined selection payload. The teacher (Astra) also has web search and may research beyond that payload; the eventual Laya model receives only the payload. Laya therefore learns to copy picks that may rest on facts it does not see.

The selected execution model is separate. It gets the normal Pi task context, repository access and tools. The initial/default execution model may gather evidence before selection when the cache needs refreshing; Laya does not perform that research; the teacher may do its own.

## Version 0.0.1 acceptance

For version 0.0.1, Laya must learn to match the teacher’s picks. The numerical agreement threshold remains to be set. Product-outcome evaluation, full-conversation suitability and feedback-driven improvements come later.

Goldilocks selections and alternatives must satisfy hard constraints. If the router fails, Pi continues with its normal default as-is; that accepted fallback is not guaranteed to satisfy Goldilocks constraints. An empty eligible pool returns no selection rather than invoking that fallback.

See the [release numbering rules](docs/PLAN.md#release-numbering) for version bumps and release tags.

## Documentation

These documents are the current source of truth:

1. **README.md:** product scope and settled decisions.
2. **[Design](docs/DESIGN.md):** routing flow, evidence, boundaries and operational behavior.
3. **[Plan](docs/PLAN.md):** delivery stages, validation and remaining decisions.
4. **[Decisions](.agent/learning/decisions.yml):** the numbered ledger of approved decisions. A newer entry supersedes the older one it names.
5. **[Rules](.agent/rules.yml):** working rules for agents, each citing the decision that approved it. Proposed rules wait in [candidates](.agent/learning/candidates.yml) until approved.

For coding agents: read [AGENTS.md](AGENTS.md) (also linked as `CLAUDE.md`) for the preferred skills, how to record decisions and the git workflow. Changes go through pull requests using [the PR template](.github/pull_request_template.md); nobody pushes directly to `main`.

Status: the teacher-backed Pi extension is implemented. Live tests verified automatic Token Factory selection, model pinning on follow-up, extension reload without rerouting, and actual parent-to-subagent delegation. Automated tests cover cache behavior, constraints, output validation, privacy and timeouts. Laya training/calibration and product-quality/cost benefits remain future work.

## Run locally

Requires Node 22.19+ and Pi (tested with `@earendil-works/pi-coding-agent` 1.5.2). Node runs the TypeScript source directly. For development, run `npm ci` to install the pinned compiler and SDK, then `npm run typecheck` to check the source, configuration, extension, scripts and tests.

1. In Pi, run `/login openai-codex` and sign in. Sol must be available in that account.
2. Put `TAVILY_API_KEY` and `NEBIUS_API_KEY` in a local `.env` using [.env.example](.env.example). Never commit keys.
3. Prepare the local evidence once:

```sh
npm run evidence -- catalog
npm run evidence -- discover
npm run evidence -- links
npm run evidence -- refresh
npm run doctor
npm start
```

The local package is also registered in this project’s Pi settings. You can run `pi` here (trust the project if Pi asks); use `/reload` in an already open session to load it. `npm start` explicitly selects the Codex teacher as the initial fallback model.

`discover` reuses an existing crawl; `--force` deliberately recrawls. `links` extracts the AA evaluation/index directories. The local setup currently has 24 catalogue entries, 23 tool-capable chat candidates and 53 discovered AA pages. These are a dated discovery result, not a guarantee of exhaustive site coverage.

Use [goldilocks.config.ts](goldilocks.config.ts) for defaults and an optional model-ID allow-list. If upgrading a customized configuration, transfer your values from `goldilocks.config.mjs` to the TypeScript file. Every setting has comments describing its meaning, units and allowed range. In Pi:

```text
/goldilocks status
/goldilocks quality 4
/goldilocks cost 0.50
/goldilocks cost off
/goldilocks refresh
/goldilocks capture on
/goldilocks capture off
```

`quality` ranges from 1 (economical/adequate) to 5 (strongest task capability), with 3 balanced. `cost 0.50` sets a **$0.50 per million total tokens** ceiling at a fixed **50% uncached input + 50% output** blend; both the pick and alternatives are filtered against it before calling Sol. Unknown prices are excluded when a ceiling is active. `cost off` removes the ceiling; the default is off because no dollar limit has been chosen. Actual task spending depends on token use and input/output mix; this comparison rate is not a per-task spending cap. The accepted native-fallback exception still applies.

`/goldilocks status` shows separate input/output/blended rates and recorded Token Factory token usage/cost on the conversation branch. Costs are labelled as catalogue estimates unless provider-reported; router/subagent calls are not included in this total. It also labels quality's 1–5 range and the cost ceiling's dollar units. Resuming through `npm start -- --continue` preserves the saved execution model.

Command changes apply to that Pi process; edit the commented config file and restart Pi for persistent defaults. Capture is off by default and stores exact router inputs/outputs locally when enabled. It does not train a model automatically. Ordinary logs exclude task text.

The active model can call `goldilocks_subagent` with complete task instructions and an allowed subset of the parent's built-in tools. Each child is an in-memory Pi session with a routed model, no recursive delegation and a five-minute execution deadline. Different models' actual tool-use reliability varies even when the provider advertises tools.

All extracted pages are stored in `.cache/goldilocks/aa-pages.json`; URLs in `aa-urls.json`; the original crawl in `aa-crawl.json`. They are Git-ignored. Whole pages are selected into the router payload within a configurable budget (default six pages / 180,000 characters), and omitted URLs are declared; selected pages are not silently truncated. Refresh failures can use the last valid snapshot for up to seven days with a warning. First-install evidence failure falls back visibly rather than pretending to have benchmark data.

Confidence is explicitly uncalibrated (`null`), and Token Factory endpoint latency is unknown. Routing does not claim that AA results from a different harness/provider predict identical task results. A full-page evidence payload is the teacher-stage contract; adapting that representation to Laya's context limit remains to be designed.

Run `npm test` for offline tests. `npm run smoke` makes live teacher/provider calls to verify a conversation, follow-up, reload and direct subagent execution. `node --env-file=.env scripts/smoke.ts --delegation` additionally checks a model-generated tool call. No quality benchmark is implied by these connection tests.
