# Receipts: a decision model that separates signal from hype

## The problem

Every week, AI launches flood X, LinkedIn and Hacker News. Each one claims to beat everyone, ship today, change everything. Almost none of that is checked. Reading it all costs hours, and the loudest launches are rarely the best ones. This is a personal pain point for anyone who follows the field: the signal is buried under marketing.

## What we're building

**Receipts**, a small open decision model that reads a launch story and returns a structured, evidence-backed verdict: what is actually new, what is recycled marketing, and which claims hold up.

For each story it produces a report card:

- **Novelty score (1-5):** how new is this, really, compared to what already exists
- **Slop score (1-5):** the gap between how strong the claims are and how strong the evidence is
- **Claim-by-claim verdicts:** confirmed, self-reported, contradicted, or unverifiable, each pointing at its evidence
- **What it actually is, in one line**, with the marketing removed

The key rule: the model never trusts the announcement. It pulls the claims out, searches the web to check them, verifies hard facts directly (are the weights actually on Hugging Face, is there a real pricing page, does the package exist), and only then judges. A claim counts as confirmed only if an independent source backs it. Thirty copies of the same press release still count as one self-report.

## What ships

1. **The model** on Hugging Face: Qwen3-8B, fine-tuned on thousands of teacher-labelled launch verdicts, open weights
2. **HypeBench**, a public benchmark of past launches labelled by what actually happened to them (did it ship, did the claims hold up)
3. **A live demo**: paste a launch URL, get the receipts card
4. **A plugin** (browser badge + MCP server) so the verdict shows up where people actually read the news

A personal layer comes later: the same world verdict, re-ranked for what you personally have and haven't seen.

## Why this is worth building

Nobody emits machine-readable, claim-level, evidence-cited verdicts per launch. Existing tools summarise the hype; this one scores it. And the benchmark is the moat: a model judged on whether its verdicts matched reality, not on vibes.

## Where we are

- Design is locked: architecture, scoring rubric, output schema, two-pass pipeline
- Two smoke tests passed end to end, by hand, against launches with known endings: DeepSeek R1 (real, underhyped at launch) and the Humane AI Pin (all claims, no evidence). Both cards landed where reality later did
- Next: run the same pipeline across 20 known launches as a baseline, generate the training data, train, evaluate, ship

## Timeline

Three focused days after the baseline: day one data, day two training and evaluation, day three Hugging Face release, demo and launch posts.

## Total cost

**$50-75 all in** on the lean path:

- Baseline inference: under $2
- Training (RunPod GPU, several runs): $5-15
- Training data labelling (4,000 examples, open teacher model): $20-40
- Hosting and demo: free (Hugging Face)

A premium path using frontier models for labelling would run $300-400, but only if the lean labels fail quality checks. The decision gets made after the first 100 labelled examples, not before.

## What we need

Nothing yet, except honest reactions. If this sounds useful, the most valuable help later is testing the demo on launches you care about and telling us where the verdicts are wrong. The rubric is only as good as the people arguing with it.
