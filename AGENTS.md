# Agent instructions

This file is for coding agents (Claude Code, Codex, Pi and others) working in this repository. Humans can read it, but it is written for agents. If your client does not load this file automatically, read it before you start work.

## Read first

1. `README.md`: product scope and settled decisions.
2. `docs/DESIGN.md`: routing flow, evidence, boundaries and operational behavior.
3. `docs/PLAN.md`: delivery stages, validation and open decisions.
4. `.agent/learning/decisions.yml`: the approval ledger. Explicit decisions there outrank older guidance.

## Recording decisions

Add an entry to `.agent/learning/decisions.yml` when the user explicitly states or approves something that changes scope, design, the plan, a tool or model choice, or a working rule. This includes choosing between options you offered, correcting an earlier decision, and stating a working rule. A decision is in force at once; it does not go through a candidate. If it is a working rule, also add it to `.agent/rules.yml` citing the decision.

Do not add an entry for routine edits, your own proposals the user has not approved, or questions that are still open (those belong in `docs/PLAN.md`).

How to record:

- Use the next number, `DECISION-NNN`. Never renumber or delete entries.
- Quote the user's words in `selection`, set `explicit_user_feedback: true`, and cite the commit or files in `evidence`.
- When a decision replaces an earlier one, add a new entry that names the old id. On the old entry set `status: SUPERSEDED`, add `superseded_by: DECISION-NNN`, and add "Superseded by DECISION-NNN." to its `decision` text.
- When a decision changes only part of an earlier one, the old entry stays `APPROVED`; add `amended_by: DECISION-NNN` to it. Read the two together.
- Only entries with `status: APPROVED` are in force.
- If the decision changes what `README.md`, `docs/DESIGN.md` or `docs/PLAN.md` say, update them in the same change so the docs and the ledger agree.

## Learning loop

`.agent/rules.yml` is the registry of working rules. Each rule cites the approved decision it came from. Follow the rules there.

Candidates are for rules you infer, not rules the user states (those are decisions, above). After a meaningful task, review it: did the user correct a specific output, did something break, did you repeat a mistake, or did you see a code smell, where a rule the user has not stated would have helped? If so, propose a rule:

1. Add `CANDIDATE-NNN` to `.agent/learning/candidates.yml` with `status: NEEDS_DECISION`, `proposed_rule`, `evidence` (a list of what happened), `reason`, `affected_files`, `originating_task`, `confidence` (HIGH, MEDIUM or LOW), `suggested_enforcement`, `explicit_user_feedback` and `conflicts`.
2. Tell the user about the candidate. Do not act on it as a rule yet.
3. When the user decides, record a decision as above, then set the candidate's status to `ADOPT`, `ADAPT`, `REJECT` or `NOT_APPLICABLE` and add `decision_id`. For ADOPT or ADAPT, add the rule to `.agent/rules.yml` citing the decision.

Only explicit user approval turns a candidate into a rule. Agent preference, repetition or recency is never approval.

## Preferred skills

Use these skills when the task fits. They are installed per machine, not in this repository. If a skill is missing, tell the user and give the install command; do not install it without approval.

| Skill | Use it for | Source |
| --- | --- | --- |
| `asd-ste100` | Simplified Technical English (ASD-STE100) for text that agents or people must not misread: docs, prompts, instructions, error messages, status reports | `github.com/danyuchn/asd-ste100-skill` |
| `c4-architecture` | Architecture diagrams with the C4 model (context, container, component, dynamic, deployment) in Mermaid | `github.com/softaworks/agent-toolkit`, path `skills/c4-architecture` |

## Git workflow

- Never push directly to `main`. Always work on a branch and open a pull request.
- Every pull request uses `.github/pull_request_template.md`.
- Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages and pull request titles: `type(scope): summary`, for example `docs(plan): add training hardware check`. Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.
- Do not put personal names in commit messages, pull request text or the planning documents.
- Never commit API keys, private task data or transcripts.
