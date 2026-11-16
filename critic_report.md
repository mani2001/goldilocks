# Stage 7: Critic Review

**Target:** `concepts_brief.md` (whole file; FeatureRange 1..End, no implementation plan)

**Reviewers.** Each ran in a fresh context:

| Reviewer | Standard | Verdict |
|---|---|---|
| egm-design | `feature-spec-standard` | FAIL: 2 Blockers, 10 Majors, 4 Nits |
| egm-structural | `feature-spec-standard` | Pass with Majors: 6 Majors, 9 Nits |
| egm-style | persona only | 6 Majors, 13 Nits |

All three completed. None of them opened the PNG renders; they checked only the Mermaid sources.

Duplicates are merged below. The tag after each finding names its source: D = design, Str = structural, Sty = style.

## Blockers

**C1. The evidence extraction step breaks the brief's own security rule (D1).**
- S6 says "the harness LLM turns the cached pages into `results.json`". So raw crawled page text goes into an agent that has file-write and shell tools.
- S6 also says "crawled text never reaches the model or the orchestrator as free text". Both statements cannot be true.
- A prompt injection on any page in the allow-list could run actions on the developer's machine. The S5 checks validate only the numbers that come out. They do nothing about tool calls the LLM makes while reading the page.
- **Fix, either of:**
  - do the extraction in a tool-less, sandboxed LLM call made by `fetch_evidence.py`, using a structured-output schema;
  - restrict the sources to structured APIs and the published snapshot.

  Then restate the invariant so the design actually enforces it.

**C2. The Alternatives section fails the standard's Alternatives Rule (D2, Str M2, Sty M6, Str M1).**
- **D:** rejected with no reason, even though the review's own main recommendation (the B+D hybrid, the Ideal Final Result) depends on it.
- **Existing routers:** "not yet weighed".
- **A:** its rejection ("B's learned interactions") does not answer the Day 0 finding that "the gap is a feature gap, not a model gap".
- **B:** the chosen design has no entry in the section. The letters A–D are used about 200 lines before they are defined.
- **Fix:**
  - give a concrete reason for rejecting D, or adopt the hybrid;
  - add one line per existing router;
  - answer the feature-gap finding;
  - define A–D in the Overview.

## Majors

**C3. Three different accounts of who refreshes `results.json`, and the diagrams contradict S6 (D3, Str M3, Str N9).**
- The brief names three owners:
  - a skill (Overview);
  - code, refreshing in the background (Risk 8);
  - the harness LLM (S6).
- A background Python process cannot use the harness LLM.
- `c4-context-runtime.mmd` still shows the "Artificial Analysis API", which S6 rejected.
- `c4-container-runtime.mmd` shows the snapshot downloaded "by default", while S6 calls it optional.
- **Fix:** pick one owner and one extraction method, then update S6, Risk 8, Decision 5 and all three runtime diagrams to match.

**C4. Diagrams commit to choices that the text leaves open or contradicts (Str M4).**
- The engine diagram feeds Laya "tokens", which is the single-sequence input. That choice is still open, and the Ideal Final Result uses candidate vectors instead.
- The training diagram has no price-perturbation step and no price-shift test set. Decision 8 requires both.

**C5. v1 harness scope contradicts itself (D4).**
- Decision 6 and the "What changed" table list four harnesses.
- The non-goals allow only one.
- The spike found Codex blocked.
- **Fix:** v1 is one harness, provisionally OpenCode. Mark Codex as blocked.

**C6. Picking a provider is promised but cannot be applied (D5).**
- G1 and Decision 1 promise model plus provider.
- Claude Code cannot apply a provider per subagent.
- Risk 12 recommends a lookup in code instead.
- **Fix:** choose the provider with a deterministic lookup after the model pick, and state per harness whether a provider can be applied at all.

**C7. Performance claims are unsupported, and one is wrong (D6).**
- "Well under 100 ms on a CPU" contradicts Risk 9's "hundreds of ms to seconds".
- "Laya reads only the task" does not remove the token limit. Subagent prompts are long, and the checkpoint has a 1,024-token context.
- Parallel spawns queueing on one CPU encoder are not addressed.
- **Fix:**
  - remove the 100 ms figure;
  - state a truncation policy or a context-extension plan;
  - add the expected concurrency to the latency target.

**C8. Cost figures contradict each other, and the case for B depends on them (D7, Sty M1, Sty M2, Sty M3).**
- Risk 6 uses $0.0003 per teacher call, which is the Day 0 Qwen3 rate.
- Risk 10's $280–560 over 24k prompts works out to $0.012–0.023 per call.
- "$0.30–0.60" and "under $10" are both quoted as PLAN.md's labelling cost; "under $10" is actually PLAN's total.
- The heading says "100–1,000x", but the brief's own numbers give about 470–1,870x.
- "A fraction of the teacher's cost" has no number attached.
- **Fix:** name the teacher, use one per-call cost throughout, redo the break-even, and include the extra cost of the counterfactual labelling.

**C9. Confidence has two meanings (D8).**
- S2 accepts "the teacher would agree".
- The trade-off table uses "within ε of the best cost-adjusted option". That needs outcome data, and ε is undefined.
- Open item 3 still lists the question as open.
- **Fix:** keep one meaning, and mark the other as future work.

**C10. Three fallbacks, and no way to detect unfamiliar input (D9).**
- The brief names three fallbacks: the parent's model (Risk 7), the rules engine (trade-off table), and A (Alternatives).
- G6 requires falling back on low confidence and on unfamiliar input. The component diagram has no low-confidence path and no detector for unfamiliar input.
- **Fix:** set one fallback order, add the low-confidence path, and say how unfamiliar input is detected (or drop that clause from G6).

**C11. The Claude Code reroute can widen a subagent's tools (D10).**
- Rewriting `subagent_type` replaces the requested agent's tool limits. A read-only `Explore` agent could gain write or shell tools.
- **Fix:** make it a hard requirement that the requested agent's tools and system prompt survive the reroute, and test it.

**C12. Outcome signals have no source (D11).**
- The brief relies on four signals:
  - "the model that actually ran";
  - 404 and 429 refresh triggers;
  - logged outcomes;
  - the dynamic diagram's "actual model logged" step.
- All of them need a post-run hook, and none is defined.
- **Fix:** name a post-run hook per harness, or drop these signals from v1.

**C13. The goals do not measure the user's promise (D12).**
- Every metric is agreement with the teacher. No goal measures cost saved at matched quality.
- G4 omits C (the prompted teacher) as a baseline, although Risk 6 requires it.
- **Fix:** add a small product-outcome goal, and add C to G4.

**C14. The teacher gate has no threshold (Sty M4).**
- "Clearly beat" and "must agree" have no numbers.

**C15. The "What changed from PLAN.md" table is incomplete (Str M6).**
- Missing rows:
  - the capability mapping reversed from "no retrain" to "schema change";
  - `results.json` schema versioning;
  - hooks replacing skill-driven gathering;
  - the dropped `fit_score` and `evidence_sufficient` heads.

**C16. "Most widely trusted index" is an unsupported superlative (Sty M5).**

**C17. The ordered list item "2a." is broken Markdown (Str M5, Sty N13).**
- It renders as a continuation of item 2.
- **Fix:** renumber the list.

## Nits

**Privacy and refresh**
- The decision log stores full prompts. Log a hash by default and make full-prompt logging opt-in (D13).
- Parallel spawns can start duplicate background refreshes. Use a single-flight lock (D14).
- Artificial Analysis redistribution is called "unverified" in S6 but stated as fact in Risk 13 (D15).

**Undefined terms**
- capability mapping (D16)
- RLCD (D16)
- student (Sty M6)
- Day 0, ε, VPS, the `choice` head, the 33 ms source, "inventive catalyst" (Sty N11)

**Cross-references**
- The PLAN.md §4.1 reference should point to §3.3 (Str N1).

**Document structure**
- Risk headings are nested at the wrong level, and the risk template is inconsistent: Risks 1–5 have a separate mitigation block, Risks 6–13 put mitigations inline (Str N2, N3).
- Goals come after 190 lines of analysis, and there is no Problem Statement heading (Str N4, N5).
- "What changed" should be its own H2 (Str N8).
- Links are inconsistent: S and Risk references cannot be clicked (Str N7).

**Formatting**
- `*` and `-` bullets are mixed (Str N6, Sty N13).

**Wording**
- Filler and value words: "more than usual", "a real job", "honestly", "means little" (Sty N2, N3, N6, N7).
- Assumptions stated as fact: "hundreds of times a day", "most of a subagent's cost comes from tool loops", "2–15x" (based on two data points) (Sty N1, N4, N5).
- Vague figures: "saves very little", "well under 100 ms" (Sty N8, N9).
- The B+D recommendation is attributed to "most" reviewers in one place and to all of them in another (Sty N10).
- The prompt-injection point is stated twice, in S6 and Risk 8 (Sty N12).
