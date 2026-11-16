# Goldilocks — Complete Plan

**What:** A decision model that picks the right AI model for the task, under the user's constraints, with live web evidence and reasons for every pick.

**Status:** Day 0 complete (Nov 15, 2026). Architecture locked in two parts (decision model + plugin).

**Repo:** [github.com/mani2001/goldilocks](https://github.com/mani2001/goldilocks) (public, contains README only as of Nov 15).
**Working files:** `~/workspace/goldilocks/` (spec, Day 0 report, candidate data, task set, baselines).

---

## 1. The problem

Model selection is hard and getting harder. There are 400+ models on OpenRouter alone, prices change without notice, new models arrive with no benchmarks, and the tools that claim to help are broken in known ways (from our landscape research, Nov 15):

- **Stale data as the default.** Small routers route off hardcoded benchmark tables from 2024–25. RouteLLM (5,706★) is frozen since Aug 2024, trained on a single model pair.
- **Heuristic complexity ≠ difficulty.** LiteLLM's beta Auto Router and small PyPI routers score difficulty from prompt length and keywords, and systematically misroute short-but-hard prompts.
- **Silent misroutes.** A cheap model plausibly wrong, 200 OK. The most dangerous failure mode — no error, no signal, just a worse answer.
- **Routing collapse.** Routers degenerate to the most expensive model as budget rises; the oracle uses the strongest model less than 20% of the time.
- **No learning from real outcomes anywhere.** No router we found learns from production results.
- **Low savings ceiling.** RouterArena: the best of 27 routers achieved ~77% of oracle accuracy at ~5x oracle cost.

**Goldilocks' wedge (confirmed unoccupied):** live web evidence as a routing signal, learning from real production outcomes, constraint-aware ranking (budget, latency, context, modality, residency, open-weights as first-class inputs), safety-aware routing, and decision explainability.

---

## 2. Architecture — two parts

### 2.1 Part 1: The decision model (the core)

A lightweight, pure-function decision model. No tool calling, no web search, no text generation. It takes input context and returns a structured decision in a single forward pass.

- **Base model:** Laya (`convaiinnovations/laya-typed-decisions`), fine-tuned for routing.
  - ModernBERT-large encoder (~395M) + two-layer decision head. **421M parameters total.**
  - Apache 2.0, open weights, released Sept 2026 by Convai Innovations.
  - Non-autoregressive. ~33ms per question on GPU. Small enough to run locally on a laptop.
  - Typed primitives: `choice` (probability distribution across options), `score` (expected value on an ordinal scale), `noul` (calibrated P(true)).
  - Calibration: ECE 0.466 as shipped, 0.081 after temperature fitting (fit temperature on our own data).
  - **Fine-tuning is required, not optional.** Laya's head was trained on triage/guardrail decisions; the base checkpoint scores near chance (36.2%) on new decision types. Our ranking decision must be taught on our teacher-labelled data.
  - **Benchmark against plain ModernBERT-large** on the dev set to verify Laya's decision-tuned encoder actually transfers for routing. Plausible, not proven.
- **Input:** context (task + constraints + candidate list + gathered evidence). See §3.
- **Output:** structured, by construction (see §4). No JSON generation, no parsing, no validation failures.
- **Published to HuggingFace:** weights + model card + task→ranking dataset.

### 2.2 Part 2: The plugin (the harness integration)

Skill files that instruct an agent harness (Pi, OpenCode, Claude Code, etc.) to gather context and feed it to the decision model.

- **What the skill files instruct the agent to do:**
  - Search the web (Tavily) for current pricing, benchmarks, release news, deprecations, and real-world reports on candidate models.
  - Look up structured indexes (Artificial Analysis Intelligence Index, per-benchmark scores, cost/time per task).
  - Check datasets and community opinion (X, benchmarks leaderboards) for qualitative signals.
  - Format everything as input context for the decision model.
  - Call the model, wrap the output into the JSON schema (with lookups and assembled reasons), and present the pick.
- **The plugin is where live evidence lives.** The model doesn't search; the harness does. The model reads the context it's given and ranks from it.
- **Distribution:** the plugin plugs into harnesses where developers already work. First harness TBD (Pi, OpenCode, and Claude Code are the candidates).
- **Alternative interfaces (later):** MCP server (`pick_model`) + CLI, demo Space on HuggingFace.

### 2.3 Why the split

- The model stays lightweight, portable, and fast — a pure function with no API dependencies at inference.
- The harness already has tools and search, so asking it to gather context is natural.
- The HuggingFace publication is clean: a small model with a simple input/output contract.
- The plugin is the distribution mechanism and the live-evidence layer.
- This shape matches the decision-model identity (Laya-shaped: input context → typed decision, no generation, no tools).

---

## 3. Input context

The model receives a context containing:

- **The task** in plain words.
- **Soft constraints** the head weighs: budget (max blended cost per 1M tokens), latency bar, quality floor.
- **The eligible candidate list** — model+provider pairs, each with:
  - Price in/out per 1M tokens.
  - Context length.
  - Six capability scores (0–5): reasoning, coding, writing, vision, tools, knowledge (see §3.1).
  - Latency (time per task, where available).
  - Modality, open weights flag, provider, release date.
  - Live-evidence notes (release recency, price-change flags, qualitative tags, benchmark-coverage confidence).
- **Hard constraints are pre-filters (masks), not features:** availability (user's configured providers/keys + live model availability), context length, modality, open-weights-only. A learned head can get a hard constraint wrong; the mask is applied before ranking. *Soft* availability (rate-limited, degraded, flaky) is a reliability signal and may legitimately be a feature.
- **The candidate list is dynamic and variable-length** (post-filter). The head scores each (task, candidate) pair and ranks.

### 3.1 The capability layer

Benchmarks (evolving, many) map to **six fixed capability dimensions** (reasoning, coding, writing, vision, tools, knowledge; 0–5) via a mapping config in code. The head's input shape never changes.

- New benchmark = update the mapping config, recompute capability scores, **no retrain**.
- Raw benchmark scores are noisy and non-comparable across harnesses; the capability layer averages multiple benchmarks per dimension and keeps the mapping auditable.
- Symmetry: tasks carry capability requirements on the same 0–5 scale, so the head's core job is matching task requirements to model capabilities.
- AA's six "Capability Indexes" are industry verticals (Finance, Legal, Healthcare, etc.) — they map to task *domains*, not the six skill dimensions. The capability layer needs both: AA verticals for domain fit + classic per-skill benchmarks for skill dimensions.

### 3.2 Context format (open decision)

How the gathered evidence reaches the model — structured JSON or serialized text — is not yet decided. The model is an encoder, so it can read text context, but structured features are cleaner for numbers. This is the key interface decision between the plugin and the model.

### 3.3 Context length (open problem)

20 candidates serialized as text into one sequence strains Laya's 1024-token typed-decisions checkpoint. Options: compress candidate descriptions aggressively, or extend context in fine-tuning (ModernBERT-large supports 8k natively). Needs a design decision before training.

---

## 4. Output schema

Structured by construction. The model's outputs are probabilities and scores; the plugin wraps them into JSON with lookups and assembled reasons.

### 4.1 From the model

| Field | Source | Notes |
|---|---|---|
| `pick` | `choice` primitive | Model name + provider of the top-ranked candidate |
| `confidence` | `choice` probability | Calibrated (RLCD); "how sure am I this is the best pick" |
| `ranked` | `choice` distribution | Top-3 ranked candidates with scores, free from the distribution |
| `fit_score` (1–5) | `score` primitive | How well the pick matches the task's capability needs. Different from confidence: fit is "how good is the best pick for this task" |
| `evidence_sufficient` (probability) | `noul` primitive | "Is the gathered context enough to make a confident pick?" Tells the plugin when to gather more evidence |

### 4.2 From context lookup (free, exact)

`provider`, `cost_in_per_1m`, `cost_out_per_1m`, `latency_estimate`, `context_length`, `open_weights`, `modality`, `release_date`. The plugin already has these; no prediction needed.

### 4.3 Assembled by the plugin (code, not model)

| Field | Notes |
|---|---|
| `reasons[]` | Built from feature deltas in the context ("picked X over Y because X scores higher on coding at half the price"). Not generated by the model |
| `estimated_cost_per_task` | Anirudh's metric: token estimate × price + retries + failure cost. A cheap verbose model can cost more per task than an expensive terse one. The plugin estimates tokens from task type/history |
| `warnings[]` | e.g. "new model, thin benchmarks," "promotional pricing," "no vision support confirmed" |
| `alternatives` | What the pick would be if the budget were relaxed (re-run ranking with looser constraints). Shows the user what they're giving up |
| `as_of` | When the evidence was gathered — freshness timestamp |
| `unconstrained_pick` | If availability filtering removed the best model, name it here ("Opus 5.5 would have been the pick, but you don't have Anthropic access") |

### 4.4 Schema principles

- Every field earns its place by being something the user or harness acts on. A field nobody reads is noise.
- Model-output fields need teacher labels in training. Lookup and plugin-assembled fields are free.
- Extra fields can be added later; the schema is ours to define.

---

## 5. Data

### 5.1 Candidates

**20 candidates** (OpenRouter side, AA Intelligence Index v5.0, Oct 29 2026):

| Model | AA index | $in/$out per 1M | Open |
|---|---|---|---|
| Claude Opus 5.5 | 58 | $4/$20 | No |
| GPT-6 Astra | 57 | $10/$50 | No |
| GPT-6.1 Sol | 55 | $2/$10 | No |
| Claude Sonnet 5.5 | 54 | $2/$10 | No |
| GPT-6.1 Terra | 51 | $1/$5 | No |
| Gemini 4 Argon | 50 | $2/$10 | No |
| Kimi K3.1 Pro | 46 | $2/$10 | No |
| Muse Wonder | 43 | $4/$20 | No |
| Muse Spark 1.3 | 36 | $1.25/$4.25 | No |
| Claude Haiku 5.5 | 36 | $0.10/$0.50 | No |
| Grok 4.7 | 35 | $2/$6 | No |
| Qwen3.8 Max | 34 | $2/$6 | No |
| DeepSeek V4.1 Flash | 32 | $0.02/$0.108 | Yes |
| GLM-5.3 | 32 | $2.80/$8.80 (prime) | Yes |
| Gemini 3.8 Flash | 31 | $0.825/$4.125 | No |
| MiMo-V2.6-Pro | 30 | $0.435/$0.87 | Yes |
| MiniMax-M3.1-Flash | 29 | $0.075/$0.30 | Yes |
| GPT-6 Luna | 28 | $0.10/$0.50 | No |
| Mistral Large 4 | 26 | $0.70/$2.10 | Yes |
| Muse Spark Open | 25 | $1.25/$4.25 | Yes |

**Three providers:** OpenRouter (467-model catalog fetched Nov 15), Nebius Token Factory (24 models, live `/v1/models` list fetched from VPS), Baseten (21 Model API entries, verified from baseten.co/pricing Nov 15). Baseten prices are identical to Token Factory list prices on every overlap; OpenRouter is the outlier both ways. Baseten has Fast variants at 2x price (a latency dial).

**Key finding: the router picks model+provider, not model alone.** DeepSeek Flash is ~15x cheaper on OpenRouter ($0.02/$0.108) than on Token Factory/Baseten ($0.30/$1.20). GLM-5.3 is 2x cheaper on Token Factory/Baseten ($1.40/$4.40) than on OpenRouter ($2.80/$8.80, prime variant).

**Caveats:**
- OpenRouter's DeepSeek Flash price looks off-peak/promotional vs first-party — verify before relying on it.
- AA Index is now v5.0.1 (our data is v5.0, Oct 29). Version drift: Opus 5.5 now 59 (was 58), DeepSeek Flash now 33 (was 32). Claude Fable 5.2 (Max) leads the index at 65.
- The AA Index is built from 9 agentic evaluations AA runs themselves — NOT classic benchmarks (no MMLU-Pro/GPQA/HumanEval/AIME in the index).
- **Right now exactly ONE benchmark-derived feature is in the data: the AA Intelligence Index.** No per-benchmark scores, no capability indexes, no latency yet. Collecting per-benchmark scores (MMLU-Pro, GPQA, HumanEval, AIME, SWE-bench, LiveCodeBench, τ²-Bench) is a Day 1 task.
- AA publishes cost per Intelligence Index task, time per task, and output tokens per task — exactly Anirudh's cost-per-task metric, plus the verbosity signal.

**Files:** `data/candidates.json`, `data/nebius_candidates.json`, `data/baseten_candidates.json`, `data/openrouter-models.json`, `data/tokenfactory-models.json`, `data/tokenfactory-catalog-2026-11-06.json`.

### 5.2 Task set

**100 tasks across 32 domains** (`data/tasks.json`). Every task carries:
- Constraints (min AA index, max blended cost, context needed, latency, open-weights-only, modality, residency where applicable).
- Required capability levels 0–5 (reasoning, coding, writing, vision, tools).
- A hand-judged expected pick + reason.
- 2–3 checkable `success_criteria` (the scoring hook for measured outcomes).

**Split:** 50 dev / 50 test (seeded shuffle 20261115, alternating, repaired so every multi-task domain has ≥1 task in each split). Test half is held out — never used for iteration or tuning.

**Expected-pick spread:** Sonnet 5.5 ×21, Terra ×19, Opus 5.5 ×16, Sol ×12, DeepSeek Flash ×11, Haiku 5.5 ×10, then 10 models with 1–2 wins each. 16 of 20 candidates win at least once. Never-winners (dominated on current features): GPT-6 Astra, Grok 4.7, Muse Spark 1.3, Muse Spark Open.

**Edge cases included:** infeasible constraints (t47: min index 50 + $1 budget — tests constraint relaxation), open-weights-only hard design (t48), latency-strict + index floor tension (t50), EU residency (t65), computer use (t67), ecosystem fit (BigQuery → Argon, YouTube transcripts → Gemini 3.8 Flash, 900k-token CJK corpus → Kimi).

### 5.3 Training data

1. **Teacher labelling (~1–2k tasks):** frontier teacher (Qwen3-235B via Token Factory) labels tasks with ranked picks + reasons. The teacher's reasoning is distilled into the student; the student never sees raw search results, only the condensed context.
2. **LLMRouterBench as training data:** 391,645 measured (prompt, model) tuples from 23,945 prompts × 33 models × 21 datasets (~1.8B tokens). Two-stage story: train the task→capability mapping on it, then adapt/evaluate on the custom set with current models + constraints. Download: single tarball `bench-release.tar.gz`, 1.28 GB (HF `NPULH/LLMRouterBench`). Not yet downloaded.
3. **Measured outcomes (strongest labelling):** actually run 3–4 candidate models per task and score real outputs against `success_criteria` (judge or task checks, e.g. does the code pass tests). ~$2–5 for all 100 tasks. Turns the custom set into ~300–400 measured (task, model) outcomes. Fixes the weak point of hand-judged labels.

---

## 6. Evaluation

### 6.1 Baselines (Day 0 results)

- **Rules engine** (`baseline/rules_engine.py`): hard-filter by constraints, rank by AA index per blended dollar, relax quality floor in steps of 5 when nothing passes. **23/100 (23%)** on the 100-task set (28% on the 60-task set). Failure pattern: picks DeepSeek Flash for every low floor, Terra for every mid floor. The gap is a feature gap, not a model gap.
- **Prompted frontier baseline** (Qwen3-235B teacher, temp 0, 20-task set): **6/20 — identical picks to the rules engine.** The teacher treated min index as pass/fail then optimised cost, despite being told not to. Headline Day 0 finding: a single AA index + price + context cannot express when a hard task deserves quality headroom or when latency/reliability matters.

### 6.2 Eval structure (awaiting Mani's confirmation)

**Recommended: two separate evals, two numbers — never blended.**

1. **Product eval: custom 100-task set (50/50 dev/test).** Constraint-aware, current models, expected picks + success criteria. This is the product claim.
2. **Method eval: held-out LLMRouterBench slice.** The citable number — measured outcomes on real prompts, comparable to published router benchmarks.

**Why not blend:** different things, different model pools. A blended number is uninterpretable.

**Bridge option:** attach synthetic constraint profiles (budget/latency/context) to LLMRouterBench prompts — tests constraint handling mechanically on real measured outcomes. Constraints are fake, outcomes real.

### 6.3 What the eval must measure

- **Top-1 accuracy and NDCG** vs expected picks (product eval) and vs measured outcomes (method eval).
- **Cost saved at matched quality** — the launch story.
- **Domain structure** (which model is the specialist per domain) — table stakes; a smarter rules engine with per-domain scores could do this too. LLMRouterBench's own finding: routing gains come mostly from coarse domain structure.
- **Recall cases** — the remaining gap to Oracle is model-recall failures (routers miss the few models that answer a specific prompt correctly). The head earns its place here.
- **Trade-off cases** — where no model dominates and judgement matters.
- **Restricted-availability scenarios** — does the router handle the user not having access to the best model?
- **Cost per task** — Anirudh's metric, measured end-to-end (tokens × price + retries + failure cost).

---

## 7. Training plan

1. **Teacher labelling (Day 1):** label ~1–2k tasks with the frontier teacher. Include ranked picks, fit scores, and evidence-sufficiency judgements (for the `score` and `noul` heads).
2. **Fine-tune Laya (Day 2):** start from `laya-typed-decisions` (1024 ctx). Train the ranking head on teacher labels. Optionally freeze the encoder and train only the head first, then unfreeze. Fit temperature on dev data for calibration.
3. **Benchmark vs ModernBERT-large baseline** on the dev set to verify transfer.
4. **Evaluate on dev set, iterate.** Test half stays untouched until final eval.
5. **Outcome learning (post-ship, the long-term moat):** real pick successes/failures at known cost feed back into training. No existing router does this.

**Compute:** a 421M model fine-tune on 1–2k examples is minutes to hours on a single GPU (RunPod RTX 4090, ~$0.34/hr). The main project cost is teacher labelling (API calls), not training compute.

---

## 8. Timeline

| Phase | Work | Status |
|---|---|---|
| **Day 0** | Candidate data (3 providers), 100-task set with success criteria, rules engine + prompted baselines, landscape research, architecture design | **Done (Nov 15)** |
| **Day 1** | Teacher labelling (~1–2k tasks), per-benchmark data collection (AA table + classic benchmarks), measured-outcome labelling on the custom set, download LLMRouterBench | Not started |
| **Day 2** | Fine-tune Laya, evaluate on dev set, iterate, benchmark vs ModernBERT-large, calibrate | Not started |
| **Day 3** | Ship: HF weights + dataset + model card, plugin skill files for first harness, demo Space, launch led by the cost story | Not started |
| **Post-ship** | Outcome learning, more harnesses, more providers, safety-aware routing, reasoning-effort dial | Not started |

---

## 9. Distribution and launch

- **HuggingFace:** model weights, task→ranking dataset, model card. Open weights, open data.
- **Plugin:** skill files for Pi, OpenCode, Claude Code (first harness TBD). MCP server (`pick_model`) + CLI as alternative interfaces.
- **Demo Space** on HuggingFace.
- **Launch led by the cost story:** "pick the right model, save money, don't sacrifice quality." The eval numbers (cost saved at matched quality) are the headline.
- **Open source:** public repo, open weights, open dataset. Primary motivation is open-source community contribution — a tool Mani would use himself, built with a friend. Sale is conditional on traction, not the starting goal.

---

## 10. Costs (estimates)

| Item | Estimate |
|---|---|
| Teacher labelling (~1–2k tasks, Qwen3-235B) | ~$0.30–$0.60 (extrapolated from $0.006 for 20 tasks on Day 0) |
| Measured outcomes (3–4 models × 100 tasks) | ~$2–5 |
| Training compute (RunPod 4090, a few hours) | ~$1–2 |
| **Total lean path** | **Under $10** |

Much cheaper than the Receipts estimate ($50–75) because the model is smaller (421M vs 8B) and the teacher is cheaper. The main cost is time, not money.

---

## 11. Risks and open questions

- **Context length:** 20 candidates in 1024 tokens — needs compression or extension (see §3.3).
- **Laya transfer:** unverified — benchmark vs ModernBERT-large (see §2.1).
- **Input context format:** structured JSON vs serialized text — not yet decided (see §3.2).
- **Candidate data freshness:** prices and benchmarks change. The plugin's live gathering addresses this at inference, but training data is a snapshot.

---

## 12. Open decisions (awaiting Mani)

1. **Eval structure:** confirm the two-eval recommendation (custom 50/50 set as product eval + held-out LLMRouterBench slice as method eval, measured outcomes on the custom side).
2. **Output fields:** which extra fields to include (fit_score, evidence_sufficient, warnings, alternatives, unconstrained_pick — see §4).
3. **First harness for the plugin:** Pi, OpenCode, or Claude Code.
4. **Input context format:** structured JSON vs serialized text.
5. **Context-length approach:** compress candidate descriptions or extend context in fine-tuning.
6. **Push working files to the repo:** the Goldilocks working files (spec, Day 0 report, data, baselines) are still only in the sandbox, not in the repo. Say the word when you want them pushed.
7. **The "few final things to iron out"** Mani mentioned Nov 15 15:45 — never enumerated.
