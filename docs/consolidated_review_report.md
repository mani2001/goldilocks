# Consolidated EGM Review: `concepts_brief.md`

**Date:** 2026-11-15

**Mode:** Consolidated report, feature spec stages 5–8. The brief has no implementation plan, so Stage 9 (implementation readiness) does not apply.

**Stage reports:**
- Stage 5 (zoom out): [`zoom_out_report.md`](zoom_out_report.md)
- Stage 6 (comprehension): [`comprehension_report.md`](comprehension_report.md)
- Stage 7 (critic): [`critic_report.md`](critic_report.md)
- Stage 8 (intermediate zoom out): [`intermediate_zoom_out_report.md`](intermediate_zoom_out_report.md)

**Reviewer status:** all 7 reviewer runs completed. These were zoom-out (twice), comprehension, design, structural and style. None of them opened the PNG renders.

**Brief state:** the brief already includes the 2026-11-15 call outcomes and the harness spike results. It was not edited after the review started.

## The decision this review puts back to the authors

On the call, the team chose Approach B (fine-tuned Laya). They called A ("just if-else") and D irrelevant. Both zoom-out stages disagree. The Stage 8 reviewer argues:
- Price is a number that changes daily. Learning it inside the model is what creates most of the hardest risks: S1 counterfactual labels, Risk 2 calibration drift, the Risk 3 name shortcut, and the Risk 10 labelling cost.
- The Day 0 result was "feature gap, not model gap". The teacher matched the rules engine.
- So v1 should be A: code scores the needs implied by the subagent type against capabilities and cost per task. B, or D with price kept out of the model, comes later and must beat A.

This review cannot settle that choice; it belongs to the authors. Two outcomes:
- **Keep B:** the brief must state why (offline use, open weights, groundwork for learning from outcomes), and every B-only fix in Stage 7 applies.
- **Defer B:** most of the Stage 7 Majors fall away.

## Consolidated action items

### Blockers

**1. Decide the v1 engine and record the reason.**
- Covers: Stage 5 B1, Stage 8 B1 and B2, critic C2.
- Either keep B and state why, or adopt A for v1 with B or D later.
- Every item marked *(B only)* below depends on this choice.

**2. Fix the security hole in evidence extraction.**
- Covers: critic C1, Stage 8 M1.
- As written, the harness LLM (which has shell and file tools) reads crawled page text. This contradicts S6's own rule.
- Recommended fix: structured sources only (provider `/models` APIs, plus the Artificial Analysis API or a published snapshot), with no LLM in the refresh path.
- This reopens the call's verdict of "one crawler key instead of an AA key". With one benchmark source, either way is one key, and the AA key returns typed data.

**3. Add a link to real outcomes.**
- Covers: Stage 5 B2, critic C13, Stage 8 M5, Risk 1.
- Teacher agreement alone proves nothing about pick quality.
- Recommended fix: keep the 100-task set and its `success_criteria` as the single product gate (about $2–5 of measured runs). Alternatively, restrict the claim to "matches teacher X at Y% of its cost".

### Majors

**4. One v1 harness, OpenCode, provisional.**
- Covers: Stage 5 M1, comprehension 5, critic C5.
- Decision 6 becomes the long-term list. Codex is blocked because its subagent prompt is encrypted.

**5. Choose the provider with a lookup in code, after the model pick.**
- Covers: Stage 5 M3, critic C6, Risk 12.

**6. One refresh path with one owner, `fetch_evidence.py`.**
- Covers: Stage 5 M2, comprehension 2, critic C3, Stage 8 M2.
- Delete the refresh skill.
- Keep a staleness check in code and an atomic write. Drop the background refresh, the lock, version rotation and the 404/429 triggers.

**7. Update the diagrams after the decisions are made.**
- Covers: critic C3, C4.
- Remove the AA API source (or restore it, if item 2 brings the AA key back).
- Fix the snapshot's "by default" status, the single-sequence "tokens" input, and the missing price-perturbation step *(B only)*.

**8. One meaning for confidence.**
- Covers: comprehension 3, critic C9, Stage 8 M5.
- Under B, it is "the probability the teacher agrees". Under A, it is the score margin.
- The ε version needs outcome data; mark it as future work.

**9. Reconcile the cost figures.**
- Covers: comprehension 4, critic C8, style M1–M3.
- Name the teacher model and use one per-call cost. $0.0003 is the Day 0 Qwen3 rate; the brief's frontier teacher works out to about $0.012–0.023 per call.
- Fix "100–1,000x" (the brief's own numbers give about 470–1,870x).
- Put a number on "a fraction of the cost".

**10. One fallback: keep the parent's model.**
- Covers: comprehension 6, critic C10, Stage 8 M3.
- Drop the rules engine, A and C as further fallback layers, and drop the unfamiliar-input clause from G6.

**11. Drop post-run outcome signals from v1.**
- Covers: critic C12, Stage 8 M4.
- No harness has a defined post-run hook.
- Keep a local log of the pick, inputs and reason, with no prompt text (critic D13).

**12. Complete the Alternatives section.**
- Covers: critic C2, comprehension 1, structural M1–M2.
- Define A–D in the Overview and add a B entry.
- Give a reason for each rejection.
- Add one line per existing router (OpenRouter Auto, NotDiamond, RouteLLM, LiteLLM).
- Answer the "feature gap, not model gap" finding.

**13. Complete the "What changed from PLAN.md" table.**
- Covers: Stage 5 M6, comprehension 7, critic C15.
- Missing rows:
  - the capability mapping, which moved from "no retrain" to "schema change";
  - the dropped wedge items: reasons, outcome learning, MCP server and CLI;
  - the dropped `fit_score` and `evidence_sufficient` heads.

**14. Cut G4 to two v1 baselines: the rules engine and the subagent-type map.**
- Covers: Stage 5 N4, critic C13, Stage 8 M7.

**15. Move implementation detail to `/egm-draft`.**
- Covers: Stage 5 N1–N2, Stage 8 M6.
- This covers the spike log detail, log schemas, gate thresholds (critic C14), locks and truncation policy.
- Move the spike log out of Risk 5 into `docs/spikes/`.

**16. Remove unsupported performance claims.**
- Covers: Stage 5 M4, critic C7, Stage 8 N2.
- Delete "well under 100 ms".
- Measure one process per call before designing a daemon, ONNX export or caching.
- *(B only)* Set a truncation policy for long subagent prompts against the 1,024-token limit.

**17. Claude Code reroute must keep the requested agent's tools.**
- Covers: critic C11, Stage 8 N1.
- If Claude Code is out of v1 scope, record this as an entry condition for adding it later.

### Nits

**18. Undefined terms: delete before you define.**
- Covers: comprehension 8–13, critic D16, style N11, Stage 8 N3.
- Delete RLCD.
- Add a short gloss for student, Day 0, capability mapping and VPS.

**19. Formatting and structure.**
- Covers: critic C17, structural N1–N8, style N13.
- Renumber the "2a." item.
- Fix the PLAN.md §4.1 reference (it should be §3.3).
- Use one bullet style throughout.
- Make the risk headings H4 and use one template for every risk.
- Consider moving Goals before Analysis.

**20. Wording.**
- Covers: critic C16, style M5, N1–N10, N12.
- Remove "most widely trusted index", "more than usual", "a real job" and "honestly".
- Mark these as assumptions: the spawn rate, "tool loops dominate cost", and the 2–15x figure (only two data points).
- Remove the duplicated prompt-injection paragraph.

## Traceability matrix

| Raw finding | Consolidated item |
|---|---|
| Stage 5 B1; Stage 8 B1, B2 | 1 |
| Critic C1; Stage 8 M1 | 2 |
| Stage 5 B2; critic C13 (outcome goal), C14; Stage 8 M5 | 3 |
| Stage 5 M1; comprehension 5; critic C5 | 4 |
| Stage 5 M3; critic C6 | 5 |
| Stage 5 M2; comprehension 2; critic C3; structural N9; Stage 8 M2; critic D14 | 6 |
| Critic C4; structural M3, M4 | 7 |
| Stage 5 M5; comprehension 3; critic C9 | 8 |
| Comprehension 4; critic C8; style M1, M2, M3, N9 | 9 |
| Comprehension 6; critic C10; Stage 8 M3 | 10 |
| Critic C12, D13; Stage 8 M4 | 11 |
| Critic C2; comprehension 1; structural M1, M2; style M6 | 12 |
| Stage 5 M6; comprehension 7; critic C15; structural M6 | 13 |
| Stage 5 N4; critic C13 (baselines); Stage 8 M7 | 14 |
| Stage 5 N1, N2; Stage 8 M6 | 15 |
| Stage 5 M4; critic C7; Stage 8 N2; comprehension 8 | 16 |
| Critic C11; Stage 8 N1 | 17 |
| Comprehension 9–13; critic D16, D15; style N11; Stage 8 N3 | 18 |
| Critic C17; structural M5, N1–N8; style N13 | 19 |
| Critic C16; style M5, N1–N8, N10, N12; Stage 5 N3 | 20 |

## Next step

Answer item 1 (the engine) and item 2 (the evidence source) first; most of the other items depend on those two choices. Then run `/egm:egm-resolve` on this report, or edit the brief by hand, before `/egm-draft`.
