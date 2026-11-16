# Stage 5: Initial Zoom Out Review

**Target:** `concepts_brief.md` (whole file)
**Reviewer:** egm-zoom-out (fresh context), standard `zoom-out-standard.md`
**Files read:** persona, standard, target, `PLAN.md`, `README.md`, all six `.mmd` sources in `docs/diagrams/src/`. The rendered PNGs and the VPS artifacts were not inspected.
**Context sufficiency:** passes.
**Verdict:** changes required. 2 Blockers, 6 Majors, 4 Nits.

## Blocker 1: The most expensive engine is "decided" before the brief justifies it
- **Scope:** Key Decision 2, open item 15, Risk 6, S3, Alternatives A/C/D, G4.
- **Discrepancy:** Approach B (fine-tuned 421M Laya) is listed as decided, but the brief's own analysis undercuts it:
  - Risk 6: a teacher call costs about $0.0003 per decision, so B saves very little per call.
  - S3: most of the savings come from cheaper subagent models, which C also captures.
  - "Why B" is still open (item 15).
  - On Day 0 the prompted teacher made the same picks as the rules engine.
  - S3 also argues from a straw man. It prices C as the orchestrator reading evidence at Opus rates (1–3 cents). But C can sit behind the same hook as B, call a cheap model directly and use no orchestrator tokens. Risk 6's $0.0003 figure is exactly that case.
- **Rationale:** this is YAGNI and premature optimisation. B carries the whole training pipeline, 24k-prompt labelling, counterfactual relabelling, calibration, an ONNX daemon and weight publishing. It is committed before anyone has shown it beats A (a scoring function built on `rules_engine.py`) or C behind a hook.
- **Fix:** ship A or C behind the hook as v1. Make B, or the B+D hybrid or the frozen-encoder variant, a later stage that must beat them on stated thresholds. Alternatively, keep B and state the Risk 6 reason inside Decision 2.

## Blocker 2: Dropping the 100-task set removes the only cheap link to the root problem
- **Scope:** Key Decisions 3 and 4, Risk 1, non-goals, the README Evaluation section, PLAN §5.3 item 3.
- **Discrepancy:** the project exists to pick the model that does the task well at the lowest cost. The brief redefines "correct" as "agrees with a teacher", and on Day 0 that teacher matched the rules engine. Decision 4 also drops the only set with success criteria. PLAN puts measured outcomes on that set at about $2–5. Risk 1 then asks for a measured-outcome check that the decisions have just removed.
- **Rationale:** without that check, the system can hit every G3/G4 target and still give bad picks.
- **Fix:** keep a small measured-outcome set (the existing 100 tasks or a subagent-style set) as the gate. Otherwise, reduce the product claim to "matches teacher X".

## Major 1: Harness scope contradicts itself
- **Scope:** Key Decision 6, G1, non-goals, Risk 5, open item 10, `c4-context-runtime.mmd`.
- **Discrepancy:**
  - Decision 6 targets four harnesses, while G1 and the non-goals say only the first one.
  - Codex is blocked, because its hook cannot read the subagent prompt.
  - Claude Code needs generated agent files and still cannot choose a provider per subagent.
- **Fix:** make Decision 6 "OpenCode for v1" and move the other harnesses to non-goals.

## Major 2: Three refresh paths where one would do
- **Scope:** Overview, S6, Risk 8, Decision 5, `c4-container-runtime.mmd`, `c4-context-runtime.mmd`.
- **Discrepancy:** the brief describes three refresh paths:
  1. A crawler key, a per-URL page cache, LLM extraction by the harness, then validation.
  2. Provider `/models` APIs.
  3. A published daily snapshot.

  It also has inconsistencies around them:
  - S6 says the harness LLM writes `results.json`, while the Overview and Decision 5 say `fetch_evidence.py` does.
  - The context diagram still lists an "Artificial Analysis API" source, which S6 rejected.
  - A "refresh skill" duplicates the code-side staleness check in Risk 8 and the dynamic diagram.
- **Fix:** use the snapshot plus provider APIs for v1, with the staleness check in code and no skill. Add the crawler path only if snapshot licensing fails.

## Major 3: The pick is still model plus provider, though the brief leans toward a lookup
- **Scope:** Overview, Risk 12, Ideal Final Result, Decision 1, G1, open item 9.
- **Discrepancy:** the Ideal Final Result and Risk 12 make the provider a lookup in code. Decision 1 and G1 still have the learned model pick both model and provider. Claude Code cannot apply a per-subagent provider anyway.
- **Fix:** adopt the provider lookup in the decisions now.

## Major 4: The runtime design adds parts before latency is measured
- **Scope:** Risk 9, the trade-off table, Ideal Final Result, open item 11, `c4-container-runtime.mmd`.
- **Discrepancy:** the brief proposes:
  - a daemon shared by all harnesses, although v1 has one harness;
  - decision caching;
  - an ONNX int8 export;
  - three fallback layers (the rules engine, A, and C as an escalation path).

  No CPU latency has been measured.
- **Fix:** measure one process per call first. Use one fallback ("keep the parent's model"). Add the daemon or caching only if the latency target is missed.

## Major 5: The brief settles what confidence means while also listing it as open
- **Scope:** S2, Risk 2, the trade-off table, open item 3.
- **Discrepancy:**
  - S2 accepts "probability the teacher agrees".
  - The trade-off table uses "probability the pick is within ε of the best cost-adjusted option". That needs measured outcomes, which Decision 4 removes.
  - Open item 3 says the question is still unresolved.
- **Fix:** pick one definition that the chosen ground truth supports.

## Major 6: Existing routers are not weighed, and the change from the stated wedge is not recorded
- **Scope:** Alternatives (existing routers), S8, the "What changed" table, README, PLAN §1.
- **Discrepancy:**
  - Existing routers are "not yet weighed", yet B is committed.
  - The README and PLAN define the wedge as:
    - live web evidence;
    - reasons for each pick;
    - learning from outcomes;
    - an MCP server and CLI;
    - the 100-task eval.
  - The brief drops or defers most of these, and the "What changed" table records only some of them.
- **Fix:** add one line per existing router, and add the dropped wedge items (reasons, outcome learning, the capability-layer change from "no retrain" to "schema change") to the "What changed" table.

## Nit 1: Spike details are too low-level for a concept brief
- **Scope:** Risk 5. It lists version numbers, hook field names and alias lists.
- **Fix:** keep the per-harness verdict and the mitigations, and move the spike log to a linked file.

## Nit 2: Implementation detail in the risk sections
- **Scope:** Risks 7 and 8, S5. They list decision-log fields, atomic writes and the 50% price-change threshold.
- **Fix:** move these to `/egm-draft`.

## Nit 3: Main-session scope disagrees across sections
- **Scope:** Overview, S7, the trade-off table, non-goals.
- **Discrepancy:** S7 says "both, chosen by the user". The non-goals allow at most a pick at session start, and the trade-off table adds switching "after compaction".
- **Fix:** make main-session picking a non-goal for v1, or limit it to session start in the first harness.

## Nit 4: The baseline list in G4 is incomplete
- **Scope:** G4, Risk 6, Alternatives A/C.
- **Discrepancy:** Risk 6 makes A and C required baselines, but G4 does not list them.
- **Fix:** add A and C to G4.

**Reviewer summary:** the brief's risk analysis is sound. The main zoom-out problem is that "Decided in ideation" commits to the most complex options (B, four harnesses, model plus provider, crawler extraction) while the analysis argues for simpler ones.
