# Receipts — Rubric v1.1
*The rubric is the product. The model is its delivery mechanism. Every training label, every eval, every dispute is settled by this document. Change the rubric deliberately, version it, never silently.*

Changelog: v1.1 (2026-11-15, from BASELINE-v3) — prior-art definition (incumbents count); slop/novelty scoring guide (weight the whole claims table); category guidance (hardware = tool).

## The one question
Given a launch story and the evidence the web returns, would a sharp, sceptical developer who reads this beat daily say: **this is real, this is new, and this is worth attention** — and can every part of that judgement be pointed at evidence?

## Categories
`model_release | tool | feature_update | funding | research | partnership | other`
- Funding with no product attached is `funding` and almost always low signal by itself. A funding story is only interesting for what it *reveals* (traction, a shipped product, a notable pivot) — the money is not the news.
- A physical device / hardware launch is `tool`, even if it runs a model — the news is the device, not a weights release. `model_release` is for a model, checkpoint, or weights release. A model wrapped in a gadget is still `tool` when the launch is the gadget.

## Claims
Extract only claims that are **checkable**: benchmark numbers, capability claims ("can do X"), availability ("available now"), pricing, adoption ("used by N companies"). Ignore vibes ("revolutionary", "game-changing") — they are not claims, they are slop seasoning.

Status per claim:
- **confirmed** — backed by at least one **independent** source (not the company, not its investors, not syndicated copies of its release) or by a deterministic check (the weights/repo/package/pricing page actually exists).
- **self_reported** — only the company and its echoes say so. 30 copies of the same press release = still self_reported. **(The independence rule — no exceptions.)**
- **contradicted** — evidence says otherwise. Always cite which source contradicts.
- **unverifiable** — no evidence either way with reasonable search. A legitimate, common answer. Never guess past unverifiable.

## Prior art
Prior art is the closest existing thing the launch is measured against — **including the incumbent it claims to beat**. If the story says "beats o1", o1 IS prior art: name it, cite the evidence that mentions it, and state how the launch differs. A product named in the story itself counts; cite the story's evidence id. Search adds prior art the story doesn't mention. `prior_art` is empty only when genuinely nothing comparable exists — not because the search came back generic.

## Novelty (1–5) — new *to the world*, backed by prior_art
- **5** — first of its kind; no close prior art; the category changes if it works.
- **4** — a real new capability or approach; prior art exists but this clearly advances it.
- **3** — meaningful improvement on known things (materially better/faster/cheaper/open where it was closed).
- **2** — incremental; a version bump, a small delta, me-too with minor differences.
- **1** — rehash/rebrand; the same thing with new paint, or done many times before.
If prior_art is empty, novelty must justify itself in `delta` — and empty prior_art is a legitimate, trained answer, not a failure.
**Scoring guide:** novelty is scored against the delta from the named prior art. A launch that is open where the incumbent is closed, or an order of magnitude cheaper, or downloadable where the incumbent is API-only, scores 4–5 on that delta even while one claim (e.g. a benchmark) is still unverified. Do not cap novelty because a claim is self-reported — that is slop's job, not novelty's.

## Slop (1–5) — the hype gap: claim strength minus evidence strength
- **1** — claims are modest and fully backed; if anything it's under-sold.
- **2** — normal launch language, evidence mostly there.
- **3** — noticeable gap: big words, partial evidence, key things undisclosed.
- **4** — claims far ahead of evidence: self-reported benchmarks only, "available" that means a waitlist, recycled announcements.
- **5** — pure vapour: announcement of an announcement, no product, no evidence, coordinated PR blast, or claims contradicted by what's checkable.
Funding-only stories start at 3 and earn their way down only with revealed substance.
**Scoring guide:** slop is weighted across the whole claims table, not set by the single biggest claim. Count the claims: if most checkable claims are confirmed and only the headline benchmark is self-reported, that is slop 2, not 4 — the gap is narrow even though the headline is unverified. Slop 4 requires the *bulk* of the claims to be ahead of the evidence (self-reported benchmarks only, "available" that means a waitlist, most capabilities untested). One unverified headline claim never by itself makes slop 4.

## Substance (enum)
`new_model | new_capability | integration | wrapper | rebrand | research_only`
"Wrapper" is a classification, not an insult — a good wrapper can still score well on novelty/slop if it's honest and useful. `research_only` = a paper/preprint with no usable artefact.

## Access
`shipped | beta | waitlist | announced` — judged by what a stranger can actually do today, not what the post says. "Available to select partners" = `announced`. Record `via` (api / weights / app / paper) and whether price is known.

## Undisclosed (enum — pick all that apply)
`pricing | eval_method | eval_independent | param_count | training_data | license | rate_limits | release_date`
Only list what a reasonable reader would need and the story/evidence doesn't provide. Not every story must have entries.

## Confidence
- **high** — evidence is thick and independent; the verdict would survive new information.
- **med** — decent evidence, some claims unverifiable.
- **low** — thin or single-source evidence. Low confidence is a sanctioned answer — abstain rather than perform certainty.

## Recheck
Set `recheck_when` when the honest verdict is "ask again later": independent evals pending, waitlist not open, promised release date in the future. Otherwise null.

## The tldr
One line, written **last**, marketing removed: what this actually is, in the words you'd use to a colleague. If the tldr could run as the company's own headline, it has failed.

## Worked micro-example
Story: "Startup X launches Nova-7B, beats GPT-class models on coding, available now."
Evidence: company blog only; HF repo exists with weights (Apache-2.0); no independent eval; "available now" = API waitlist.
→ claims: coding claim `self_reported`; availability claim `contradicted` (waitlist). access: `waitlist`, via [weights, api]. novelty 3 (open 7B with strong claimed coding, crowded field). slop 4 (claim strength ≫ evidence). undisclosed: [eval_independent, pricing]. tldr: "An open-weights 7B coding model with unverified benchmark claims and a waitlisted API."
