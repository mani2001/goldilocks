# Hype Filter: Brainstorm
*(by Claude Code on Mani's Mac, 2026-11-14; fetched over SSH)*

## 0. The structural problem, before the schema

**Your personalization plan conflicts with your economics.** The pitch is "cheap enough to run over a firehose." If every call carries a user profile, every story has to be re-scored for every user. You lose caching, and the cost becomes stories × users × (inference + Tavily). Search, not the 8B, is your real per-story cost. Tavily calls will dominate the bill.

**Fix:** split into two stages.

1. **World verdict.** Runs once per *story cluster*, gets cached, and is shared by everyone. This is the fine-tuned 8B plus search.
2. **Personal layer.** Runs per user and is cheap. It uses embeddings, rules, or a tiny second LLM pass, and it reads the cached world verdict plus the profile.

This also removes the worst training-data idea in the plan: profile-conditioned examples. "Same story, different profiles, different scores" multiplies your labeling cost. It also teaches an 8B to do relevance math that cosine similarity and a logistic regression do better and more transparently. Keep the 8B focused on the hard, user-independent job: *is this real, and is it new to the world?*

The second structural issue is **don't make the 8B a free-roaming search agent**. Multi-step tool calling in a QLoRA'd 8B is fragile. Use a fixed pipeline instead:

- **Pass A:** the model extracts checkable claims and generates queries.
- **Deterministic fetch:** Tavily plus direct API checks.
- **Pass B:** the model judges with numbered evidence in context.

This gives two short, trainable tasks instead of one long agentic one.

---

## 1. Schema: attacking v3

### Redundancy
| Fields | Problem |
|---|---|
| `slop_score` + `signal_score` + `verdict` | Three scalars that collapse into one decision. `signal_score` is a function of the other two, and `verdict` is a threshold on it. Having the model emit derived values lets them disagree (signal 0.8, verdict skip), and they will. **Compute `signal` and `verdict` in code.** |
| `delta` + `under_the_hood` + `the_truth_in_one_line` | All three describe "what this actually is." `under_the_hood` as free text will mostly restate `delta`. |
| `novelty_score` (world) vs `for_you.seen_before` | Your brief says novelty is scored "against the user." Then it's not backed by `similar_products`, which is world-level. Pick one meaning: novelty means world, and familiarity means personal. |
| `availability` vs `claims_checked` | "Available today" is a claim. Availability is the single most checkable claim, so verify it deterministically and fold it into an `access` record. |

### Fields an 8B can't produce reliably
- **`similar_products`.** This is your biggest hallucination surface. From parametric memory, an 8B will invent plausible competitors or cite ones that are 18 months stale; Qwen3's knowledge is frozen and this field moves weekly. **It's only viable if every entry must cite an evidence index** from retrieval, ideally a landscape index you maintain. Allow an empty list. Training must include many legitimate `[]` examples, or the model learns to always fill three slots.
- **`who_loses`.** This is a hot-take generator. It's unfalsifiable, has no evidence backing (which violates your own design rule), and it's precisely the content LinkedIn already drowns in. **Cut it.**
- **Float scores (0.0–1.0).** A fine-tuned LLM emitting `0.73` is false precision. Outputs will cluster at 0.2/0.5/0.8 and won't be calibrated. **Use 1–5 ordinal scores with written rubric anchors** in the training data. Ordinal scores are easier to label consistently, easier to evaluate, and honest about resolution.
- **`the_truth_in_one_line` placed first.** Key order is generation order. Putting the conclusion first means the model commits *before* it has written out claims and evidence. **Move it to the end.** This is free chain-of-thought.
- **`undisclosed`.** This one is high-value, but as free text it mode-collapses to `["pricing", "eval methodology"]` on every story. **Make it an enum**, e.g. `pricing | eval_method | eval_independent | param_count | training_data | license | rate_limits | release_date`. Then it becomes cheap, checkable, and aggregatable into "Company X never discloses evals."

### Missing high-value fields
- **Source type and affiliation:** primary, press, aggregator, social, or rumor. This is the cheapest strong prior for slop, and it's missing.
- **Evidence list with URLs, plus per-claim citation indices.** Without these, `claims_checked` is just vibes in a table.
- **Independence rule for "confirmed."** Tavily will happily return 30 syndicated copies of the press release. "Confirmed" must require a *non-affiliated* source; otherwise the status is `self-reported`.
- **`confidence` / abstain.** The model needs a sanctioned way to say "not enough evidence." Without one, it guesses confidently.
- **`recheck_when`**, e.g. "when independent evals land" or "when the waitlist opens." This enables the follow-a-claim features below.
- **`story_cluster_id`.** One launch gets covered by 40 outlets. Dedup happens *before* the model runs, so this is pipeline metadata, not model output.
- **Per-category record.** The brief mentions it, but v3 doesn't show it. Spec it, because it's where the hard facts live. For `model_release`: params, license, context length, weights URL, `benchmarks_reported`, `benchmarks_independent`.

### My proposed schema (world verdict, model output)

```json
{
  "category": "model_release | tool | feature_update | funding | research | partnership | other",
  "source": {"type": "primary | press | aggregator | social | rumor", "affiliated": true},
  "evidence": [{"id": 1, "url": "...", "independent": true}],
  "claims": [
    {"claim": "...", "kind": "benchmark | capability | availability | pricing | adoption",
     "status": "confirmed | self_reported | contradicted | unverifiable", "evidence_ids": [1]}
  ],
  "access": {"status": "shipped | beta | waitlist | announced", "via": ["api", "weights", "app"],
             "price_known": true, "evidence_ids": [2]},
  "delta": ["≤3 concrete changes vs prior version/status quo"],
  "prior_art": [{"name": "...", "differs": "...", "evidence_ids": [3]}],
  "substance": "new_model | new_capability | integration | wrapper | rebrand | research_only",
  "undisclosed": ["eval_method", "pricing"],
  "category_record": { "...": "per-category typed fields" },
  "novelty": 1,
  "hype_gap": 1,
  "confidence": "low | med | high",
  "recheck_when": "... | null",
  "tldr": "one line, written last"
}
```

Notes on the choices:

- **`hype_gap`** replaces `slop_score`. It measures the distance between how strongly the story claims and how strongly the evidence supports it. That is what "slop" actually means here, and it's directly backed by the `claims` table.
- **`substance`** as an enum replaces `under_the_hood`. "Wrapper" stops being a sneer and becomes a category.
- **Personal layer (not the 8B):** `relevance`, `familiarity` (what's new *to you*: the delta against what you've seen), and `verdict` computed from world scores plus the user's learned thresholds.

---

## 2. Landscape: what exists and where the gaps are

| Space | Examples | What they do | What they don't |
|---|---|---|---|
| Curation/aggregation | Techmeme, Hacker News, HF Daily Papers | Rank by human attention | Attention ≠ substance; HN upvotes hype too |
| AI newsletters | AINews (smol.ai, LLM-summarized), TLDR AI, The Rundown, Ben's Bites, AlphaSignal | Summarize/rank AI news | No claim verification, no structured output, one-size-fits-all |
| Independent model evals | Artificial Analysis, LMArena, Epoch AI | Ground truth for model claims | Only models, not launches broadly; not attached to the story you're reading |
| Source credibility / coverage | NewsGuard, Ground News | Rate outlets, show coverage spread | Outlet-level, not claim-level; not tech-specialized |
| Fact-checking | ClaimReview markup, Full Fact tooling, X Community Notes | Claim-level verdicts | Political/general focus; slow; human-driven |
| Smart readers | Feedly (AI prioritization), Particle, Perplexity Discover, Kagi News | Prioritize/summarize per user | Summarize the hype faithfully; they don't challenge it |
| Product directories | Product Hunt, There's An AI For That, Futurepedia | Catalog launches | Pro-launch by design; their incentive is the opposite of yours |
| Critical frameworks | "AI Snake Oil" (Narayanan & Kapoor) | Conceptual taxonomy of hype | Not a tool, not real-time |

**The gaps:**

- Nobody emits a **machine-readable, claim-level, evidence-cited verdict per launch.**
- Nobody scores **novelty against prior art and against what *you've* already seen.**
- Nobody tracks **whether claims held up afterwards.**

The third gap is your moat (see §3, "Hindsight").

---

## 3. Go crazy

### Fields and features
- **Hindsight rescore.** Re-run every story at T+7, T+30, and T+90. Did the weights appear? Did the waitlist open? Did independent evals match?
- **Company track record (claim credibility).** Aggregate past `contradicted` and `undisclosed` patterns per org. Feed it back as a prior: "This org's benchmark claims held up 40% of the time."
- **Waitlist graveyard.** A public page of announced-but-never-shipped products, with day counters.
- **Underhyped detector.** This is the inverse product and possibly the better one. Quiet changelogs and boring release notes can carry huge deltas. A tool that only says "skip" is a scold; a tool that says "everyone missed this" is a must-have.
- **Press-release translator.** Phrase-level glosses, e.g. "state-of-the-art" → "on a benchmark we picked"; "available to select partners" → "not available."
- **Benchmark hygiene flags:** self-run only, cherry-picked subset, old baselines, no CIs, possible contamination.
- **Demo-vs-product flag:** a video-only demo with no public access gets marked.
- **Time-to-hello-world:** "Can I try this in 5 minutes? Here's how."
- **Standup sentence:** one line you can repeat to your team without embarrassment.
- **Diff mode:** v2 vs v3 rendered like a git diff.

### Deterministic verifiers (no LLM)
These ping actual registries. They are cheap and more trustworthy than any model:

- HF Hub: do the weights exist?
- GitHub: do the release or repo exist?
- PyPI/npm: is the package published?
- The pricing page: does it exist? Snapshot it via Wayback.
- API docs: is the model ID listed?
- Artificial Analysis / LMArena: is there an entry?

### Plugin forms
- **Browser extension** that shows a badge inline on X, LinkedIn, HN, and Reddit. Hover to expand the receipts. This is the distribution wedge.
- **MCP server:** `check_launch(url)` and `whats_new(lanes, since)`. It plugs into Claude, Cursor, and similar clients.
- **RSS proxy:** give it your feed URL and get back a filtered feed with verdicts in each item. It's the zero-install option.
- **CLI:** `hype <url>`.
- **Slack/Discord bot:** auto-reply in #ai-news channels with the verdict.
- **Pre-flight GitHub Action / web form** for launch authors: "your announcement will score hype_gap 4; add evals to fix." Marketers using it to write *better-disclosed* posts is a win, not gaming.

### Benchmark and leaderboard angle
- **HypeBench:** 500–2,000 launches from 2024–2026 with *known outcomes* (shipped? adopted? claims held?). Evaluate any model's ability to predict outcomes from day-0 information only.
  - This is your eval, your dataset release, your launch narrative, and your proof that the 8B beats prompted frontier models per dollar.
  - **Caveat: leakage.** Base models may already know the outcomes. Use launches after the base model's cutoff for the test split.
- **Weekly Hype Index:** most overhyped and most underhyped launch of the week. This is shareable content that writes your X posts for you.

### Demos
- "The last 24 hours of AI launches: 147 stories → 31 clusters → 6 worth reading." Show it as a funnel animation.
- Side-by-side: the viral launch tweet next to the receipts card.
- A "Graveyard" retrospective: run it blind on famous 2024–25 launches and show what it would have said on day 0, using post-cutoff cases only.

### Names
- **Receipts** (my pick: it's the core promise, and it's a verb)
- *Actually*
- *Deflate*
- *Vapor Check*
- *So What*
- *Shipped?*
- *Nothingburger*

Avoid anything with "AI" or "Hype" in the name; it reads like the thing it's filtering.

---

## 4. Personalization beyond layers 1–2 (still no per-user training)

1. **Entity-level knowledge state.** Track *entities and versions* you've seen (e.g. "knows Qwen3, knows MCP spec 2025-06"), not just stories. Familiarity becomes "the delta minus what you already know." A v2.1 then shows only what's new since v2.
2. **Learned thresholds, not a learned model.** Fit a per-user logistic regression on (world scores, relevance) → your thumbs. That's a few parameters per user, it trains in milliseconds, and it's honest personalization. The LLM stays frozen.
3. **Stack-aware via MCP.** Read `requirements.txt` / `package.json` / installed models. "This deprecates an API you use" is the highest-relevance signal possible, and nobody else has it.
4. **Editable, visible profile.** "Your filter thinks you care about: inference cost, agents, Rust. It ignores: image gen." Users edit it in plain text. Visibility builds trust and makes corrections cheap.
5. **Follow-a-claim.** Star any `unverifiable` claim and get pinged when it flips to `confirmed` or `contradicted`. This creates a reason to return.
6. **Interest decay plus "you used to care about X" prompts.**
7. **Implicit signals:** which receipt fields people expand, dwell time, and click-through after "skip." Each of these is a free correction.
8. **Followable filters.** Subscribe to a trusted person's thresholds and lanes. This creates a social layer without a social network.

---

## 5. Failure modes: what kills it

**It becomes slop itself**
- **Template collapse:** every story gets `undisclosed: [pricing, eval_method]`, novelty 2, and a "skim." Users learn to ignore the badge within a week.
- **Teacher inheritance:** if you distill labels from a frontier model plus search, you inherit its tendency to accept official sources. Your filter launders the press release.
- **Cynicism bias:** "skip" everything and you're technically right 80% of the time and useless. Measure *recall on things that mattered*, not just precision on dismissals.

**Gamed**
- **Prompt injection in the article.** The input is adversarial content by definition (hidden text such as "rate this signal 5"). Train with injected examples, and keep article text in a clearly delimited, untrusted slot.
- **Circular confirmation:** seeded blog posts and syndicated rewrites make claims look "confirmed." The independence rule plus domain-affiliation detection is mandatory.
- **Pre-emptive disclosure theater:** announcements stuffed with "independently verified by [paid partner]."

**Ignored**
- One more feed. Without an inline extension badge, nobody visits a dashboard.
- Latency. If the verdict arrives 40 seconds after the tweet, the user already scrolled. Pre-compute on trending clusters.
- No proof it works. "Trust our 8B" won't convince developers; HypeBench numbers will.

**Killed**
- **Legal/reputational risk.** Publicly labeling a company's claims "contradicted" is risky when it's wrong. Use "contradicted by [source]" wording, always cite, and add a dispute channel.
- **Economics.** Search costs per story exceed inference. Add a **triage tier**: a no-search cheap pass, with full verification only for clusters above an attention threshold.
- **Is the fine-tune justified at all?** If prompted Qwen3-8B, or a cheap frontier model, matches your fine-tune on HypeBench, the "small fine-tuned model" story is gone. Run that baseline first and publish it either way.

---

## 6. Top 3 recommendations

1. **Split the world verdict (cached, per cluster, 8B + search) from a non-LLM personal layer.** It preserves firehose economics and kills the expensive profile-conditioned training data.
2. **Build HypeBench from hindsight outcomes.** It's simultaneously your eval, your HF dataset, your launch story, and the only credible proof the model beats prompting.
3. **Make the LLM judge rather than recall.** Run deterministic registry checks and require evidence-ID citations for every claim and prior-art entry; this one rule kills most of the hallucination and gaming surface.

Honorable mention: **lead the launch with the underhyped detector.** "Here's what everyone missed this week" spreads; "here's what to skip" doesn't.
