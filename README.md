# Receipts — hype filter decision model

A small fine-tuned decision model that reads AI/tech launch news and returns a structured, evidence-cited verdict: signal or slop. Spec: `FINAL-SPEC.md`.

## Files
- `FINAL-SPEC.md` — the locked design (architecture, schema rationale, timeline).
- `rubric.md` — **the product.** Scoring definitions every label follows. Version deliberately.
- `schema.json` — JSON Schema for the world verdict (key order matters: evidence first, tldr last).
- `pipeline-prompts.md` — Pass A (claims + queries) and Pass B (judge) prompts; used for teacher labelling now, and by the fine-tuned student later.
- `validate.py` — validates verdict JSONs: schema + key order + evidence-id references + the independence rule for "confirmed".
- `hypebench-seed.md` — 20 known-outcome launches for pipeline testing and the Day-0 baseline. Not the final test split.
- `claude-brainstorm-prompt.md` / `claude-brainstorm-results.md` — the Claude Code brainstorm the spec synthesised.

## Build order
- **Day 0 — baselines:** run prompted base Qwen3-8B + a frontier model over the HypeBench seed (day-0 stories only). If prompting matches the planned fine-tune, stop and rethink before spending on training.
- **Day 1 — data:** rubric v1 (done) → teacher labelling with the pipeline prompts + real Tavily evidence → validate everything → 3,000–5,000 world-verdict examples, incl. adversarial (injection, syndication, waitlist-as-launch) and legitimate empty/`unverifiable` cases.
- **Day 2 — train:** QLoRA (Unsloth) on RunPod RTX 4090 → HypeBench eval vs baselines → fix worst failure classes → retrain.
- **Day 3 — ship:** merge → Hugging Face (weights + dataset + model card with benchmark chart) → demo Space (paste a launch URL, get the receipts card) → MCP plugin skeleton → launch posts led by the underhyped pick.

## Where things run (isolation rules)
- **Data generation** runs where the keys live: the VPS (Tavily key is root-only there) via Ila / the home-server orchestrator. Nothing credentialed runs on the Muse sandbox.
- **Training** runs on RunPod — needs Mani's RunPod account/API key when Day 2 starts.
- This folder (design, rubric, prompts, validators) is credential-free and safe anywhere.

## Personal layer (Stage 2, post-v1 of the model itself)
World verdicts are cached per story cluster. Per user: profile + entity knowledge state + learned thresholds (tiny model over world scores + feedback). Verdict/signal are computed in code, never emitted by the 8B.
