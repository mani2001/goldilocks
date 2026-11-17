# Agent instructions

This file is for coding agents (Claude Code, Codex, Pi and others) working in this repository. Humans can read it, but it is written for agents. If your client does not load this file automatically, read it before you start work.

## Read first

1. `README.md`: product scope and settled decisions.
2. `docs/DESIGN.md`: routing flow, evidence, boundaries and operational behavior.
3. `docs/PLAN.md`: delivery stages, validation and open decisions.
4. `.agent/learning/decisions.yml`: the approval ledger. Explicit decisions there outrank older guidance.

## Recording decisions

Add an entry to `.agent/learning/decisions.yml` when the user explicitly approves something that changes scope, design, the plan, a tool or model choice, or a working rule. This includes choosing between options you offered and correcting an earlier decision.

Do not add an entry for routine edits, your own proposals the user has not approved, or questions that are still open (those belong in `docs/PLAN.md`).

How to record:

- Use the next number, `DECISION-NNN`. Never renumber or delete entries.
- Quote the user's words in `selection`, set `explicit_user_feedback: true`, and cite the commit or files in `evidence`.
- When a decision replaces an earlier one, add a new entry that names the old id, and add "Superseded by DECISION-NNN." to the old entry's `decision` text.
- Update `README.md`, `docs/DESIGN.md` or `docs/PLAN.md` in the same change so the docs and the ledger agree.

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
