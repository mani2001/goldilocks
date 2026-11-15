# Brainstorm brief — the Hype Filter decision model

You are a sharp product + ML thinking partner. This is a pure brainstorm: answer in text, no tools, no code. Be concrete, opinionated, and disagree where you think we're wrong. No generic filler.

## What we're building

A small fine-tuned **decision model** that filters AI/tech launch news: signal out from noise. Working plan:

- Fine-tune **Qwen3-8B** (QLoRA) — a generative model turned into a decision model.
- Input: a launch story / announcement / article. At runtime it can fetch web evidence via search (Tavily) to check the story's claims.
- Output: one structured JSON verdict per story (schema below). Strict JSON, fixed core keys + a per-category record.
- Distribution: open weights + dataset on Hugging Face, a live demo, and a **plugin** (e.g. MCP server / browser extension that scores stories where you read them). Launch via LinkedIn + X posts aimed at developers who drown in AI launch hype daily.
- It is deliberately **generic** — not branded around any search vendor; web search is just the evidence tool.
- Buildable in a few days by one person. The model is small and cheap to run over a whole news firehose — that economics is the point.

## The output schema (v3 — critique this)

```json
{
  "category": "model_release",
  "the_truth_in_one_line": "...",
  "availability": "shipped | beta | waitlist | announcement_only",
  "novelty_score": 0.0,
  "slop_score": 0.0,
  "delta": ["concrete change vs previous version / status quo"],
  "similar_products": [
    {"name": "...", "overlap": "...", "how_this_differs": "..."}
  ],
  "claims_checked": [
    {"claim": "...", "status": "confirmed | self-reported | contradicted | unverifiable"}
  ],
  "undisclosed": ["pricing", "eval methodology"],
  "under_the_hood": "the actual technical substance, plain words — or 'wrapper'",
  "who_loses": "which incumbent/category gets hurt if this is real",
  "for_you": {"relevance": 0.0, "why": "...", "seen_before": false},
  "signal_score": 0.0,
  "verdict": "read | skim | skip"
}
```

Design intent: every score must be backed by a field that shows evidence (novelty is backed by the similar-products list; slop by the claims table). No two fields may say the same thing.

## Personalization (decided: layers 1 and 2 only)

- **Layer 1 — taste profile as input.** Each call carries a user profile (their lanes/topics, stack, what they've already seen, past verdicts). Novelty and relevance are scored *against the user*, not just the world. Training data will include profile-conditioned examples (same story, different profiles, different scores).
- **Layer 2 — feedback as memory.** The plugin collects user corrections ("already knew this", "this was actually slop", thumbs up/down); these are retrieved as personal examples at inference. No per-user retraining.
- Cut: per-user LoRA adapters / continual training (too much infra for v1).

## What to brainstorm

1. **Schema.** Attack v3: redundant fields, fields that sound valuable but a fine-tuned 8B model can't produce reliably, missing high-value fields. Then propose YOUR most valuable schema — every field must earn its place.
2. **Similar products & landscape.** What already exists anywhere near this (news scoring, hype/slop detection, launch tracking, structured AI news, claim-checking tools)? Where exactly are the gaps?
3. **Go crazy.** Wild fields, features, product angles, plugin forms, data sources, demo ideas, a public benchmark or leaderboard angle, naming ideas. Quantity first, judgement second.
4. **Personalization.** Beyond layers 1–2, what else makes it feel like it grows with the user — without per-user training?
5. **Failure modes.** How does this become slop itself, get gamed by marketers, or get ignored? What kills it?
6. **Top 3 recommendations**, ranked, one line each on why.

Format: structured markdown with clear sections. Prioritise insight density over politeness.
