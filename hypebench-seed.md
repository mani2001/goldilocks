# HypeBench — Seed Set v0
*Purpose: pipeline testing and a first baseline run — NOT the final test split. The final HypeBench test split must be built from recent launches (post base-model cutoff) with outcomes verified at build time. Outcomes below are from the public record as generally known; **verify each row before using it as a label.***

Each row: the day-0 story, the main day-0 claims, and what actually happened — the gap between the two is the label signal (novelty/slop a good judge should have assigned *from day-0 information only*).

| # | Launch (date) | Day-0 claims | Outcome (hindsight) | Expected read |
|---|---|---|---|---|
| 1 | Humane AI Pin (Nov 2023) | "Post-smartphone" AI device, screenless future | Shipped Apr 2024, widely panned, company sold to HP Feb 2025, device bricked | novelty 3, slop 5 — big claims, demo-driven, no independent validation |
| 2 | Rabbit R1 (Jan 2024) | "LAM" acts across your apps for you | Shipped; core actions largely scripted/limited; company faded | novelty 3, slop 5 |
| 3 | Devin (Mar 2024) | "First fully autonomous AI software engineer", strong SWE-bench framing | Real product later, but launch demo/benchmark framing heavily disputed | novelty 4, slop 4 |
| 4 | Sora (Feb 2024) | Stunning text-to-video, "world simulator" | No public access for ~10 months; shipped Dec 2024 in limited form | novelty 5, slop 3 — real breakthrough, availability claim was the gap |
| 5 | GPT-4o (May 2024) | Real-time voice/vision, "available in weeks" | Text shipped fast; advanced voice mode delayed months, rolled out gradually | novelty 4, slop 3 |
| 6 | Apple Intelligence (Jun 2024) | Deep Siri overhaul, personal context, rolling out with iOS 18 | Headline Siri features delayed into 2025–26; phased, partial delivery | novelty 3, slop 4 |
| 7 | DeepSeek R1 (Jan 2025) | Frontier-class reasoning, open weights, tiny training cost | Weights real, claims largely held up independently, enormous adoption | novelty 5, slop 1 — the underhyped-detector archetype |
| 8 | Llama 3 (Apr 2024) | Open weights, near-frontier quality | Shipped same day, benchmarks broadly confirmed | novelty 4, slop 1 |
| 9 | Claude 3.5 Sonnet (Jun 2024) | Best-in-class coding/reasoning at mid price | Shipped, independent experience confirmed the coding claims | novelty 3, slop 1 |
| 10 | Grok-1 open release (Mar 2024) | 314B open weights, a big deal by size | Weights real but undertrained for size; modest practical impact | novelty 3, slop 3 |
| 11 | Microsoft Copilot+ / Recall (May 2024) | Recall as flagship, ships with new PCs | Recall pulled before launch over security backlash, re-released much later, opt-in | novelty 3, slop 4 |
| 12 | Google Gemini Live / Astra demos (May 2024) | Seamless live multimodal assistant | Astra remained demo-stage for a long time; Live shipped in narrower form | novelty 4, slop 4 |
| 13 | Mistral Large (Feb 2024) | Frontier-class, multilingual, API available | Shipped via API/partners, claims roughly held | novelty 3, slop 2 |
| 14 | Perplexity funding rounds (2024, repeated) | Each round covered as major news | Real company, real product — but the *stories* were funding-only | category funding, slop 3 per story (no product news in the story itself) |
| 15 | OpenAI o1 (Sep 2024) | New reasoning paradigm, "thinks before answering" | Shipped (preview → full), reasoning gains independently visible | novelty 5, slop 2 |
| 16 | Friend AI pendant (Jul 2024) | Always-listening AI companion, $99 | Viral ad spend story; product reception poor, privacy backlash | novelty 2, slop 4 |
| 17 | Limitless / Rewind pendant pivot (2024) | AI memory wearable | Real niche product, modest claims, modest outcome | novelty 2, slop 2 |
| 18 | Qwen 2.5 series (Sep 2024) | Broad open-weight family, strong benchmarks | Shipped, widely adopted, benchmarks broadly credible | novelty 3, slop 1 |
| 19 | "GPT-5 is imminent" rumour cycles (2024–25, repeated) | Imminent AGI-class jump, per unnamed sources | Repeatedly not imminent on the rumoured timeline | source rumor, claims unverifiable — judge should abstain/low confidence |
| 20 | Various "we beat GPT-4" 7B model posts (2024–25 pattern) | SOTA claims on self-run benchmarks | Pattern: cherry-picked evals, no independent confirmation, forgotten in weeks | novelty 2, slop 4 — the archetype the claims table exists for |

## How the seed gets used
1. **Pipeline test:** run Pass A → fetch → Pass B on the day-0 stories (use archived/original coverage, not retrospectives — the judge must not see hindsight).
2. **Baseline run (Day 0):** prompted base Qwen + a frontier model judge the same stories; compare their novelty/slop/verdicts against the "expected read" column. This is the fine-tune justification check.
3. **Final HypeBench:** expand to 500+ with the same method on recent launches; outcomes labelled at T+30/90; test split = launches after the base model's knowledge cutoff only.
