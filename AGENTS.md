# AGENTS.md

Shared operating contract for humans and agents working in this repository with the `cloud-codegen` and `code-reviewer` Bob modes.
Keep it short, accurate, and reviewed like code. Update it when conventions change or a recurring correction is discovered.
**Do not store secrets, personal data, or real account names here.**

---

## Purpose of this mode

This workspace provides two Bob modes:

- **`cloud-codegen`** — generates modular, production-ready Python source code (`src/`) and prompt templates (`prompts/`) for cloud-native, event-driven enterprise systems from approved architecture specs, consuming [`bob-cloud-architect`](https://github.com/krondor/bob-cloud-architect) outputs. No architecture diagrams, Terraform, or full test suites.
- **`code-reviewer`** — read-only gap analysis of generated Python code against typing, docstrings, error handling, mockability, structured logging, and security standards. Does not write files or modify code.

**Workspace layout** (one spec ID shared with the architect; each mode owns its own files):

```
specs/<id>/spec.md              Human-owned; read-only for all modes
specs/<id>/{plan,tasks,checkpoint}.md   cloud-architect (read-only here)
specs/<id>/code/                plan.md, tasks.md, checkpoint.md — owned by cloud-codegen
docs/<id>/*.md                  Architecture deliverables (read-only here)
docs/<id>/code/                 sdk-evidence.md, review-findings.md — owned by cloud-codegen
src/, prompts/                  Generated code (agent output)
.bob/                           Bob config: custom modes, rules, skills, hooks, MCP example
```

`specs/<id>/code/checkpoint.md` records session state so work can resume across sessions or mode switches without replaying history. Handoff rules: `.bob/rules-cloud-codegen/04-architect-handoff.md`.

---

## Spec-driven workflow

All code generation is spec-driven. No code is written until a spec exists and a human has approved its requirements.

1. **Specify** (`specs/<id>/spec.md`): human-owned. Reuse the architect's spec and add code acceptance criteria; codegen never creates or edits it. Only a human sets approval.
2. **Plan** (`specs/<id>/code/plan.md`): component → module mapping, adapter design, dependencies.
3. **Tasks** (`specs/<id>/code/tasks.md`): ordered implementation checklist — each item one reviewable module or file.
4. **Implement**: one module at a time, validating against the spec after each.
5. **Verify**: map every spec acceptance criterion to evidence before closing the spec.

Status values: `draft`, `in-progress`, `ready-for-review`, `accepted`. Approval is recorded in `Requirements approval: pending | approved by <name> on <date> at <revision>`. A material change resets approval to `pending`.

---

## Required tools

| Tool | Minimum version | Notes |
|---|---|---|
| `python` | `>= 3.11` | Standard runtime |
| `ruff` | latest | Linting and formatting |
| `mypy` | latest | Strict type checking (`mypy --strict src/`) |
| `node` | `>= 18` | For Bob installer and the optional lint hook |

Installing alongside `bob-cloud-architect`: use `--no-agents` if the workspace already has a filled-in `AGENTS.md`.

---

## Commands

Run from the repo root:

```sh
# Lint and format check
ruff check src/
ruff format --check src/

# Strict type check
mypy src/ --strict
```

---

## Grounding sources

The agent grounds SDK calls in official documentation, within the lookup budget and evidence statuses in `.bob/rules-cloud-codegen/05-sdk-grounding.md`. When MCP documentation servers are configured (`.bob/mcp.json`, git-ignored and never packaged), it consults them before generating client calls.

---

## Git and review conventions

- **Branch naming:** `feat/<spec-id>-<slug>` (e.g. `feat/001-event-handlers`).
- **No direct commits to `main`.** Open a PR for every change.
- **Commit style:** Conventional Commits referencing the spec and task id.
- **PR description must include:** spec link, tasks covered, lint/type-check evidence.

---

## Security rules

- No secrets, credentials, connection strings, or account identifiers in source code or specs.
- All sensitive values are referenced via environment variables or secret manager adapters.
- Agent context never contains real credentials, tokens, or PII.

---

## Skills

Load with `use_skill` when the task needs them:

| Skill | Location | When to use |
|---|---|---|
| `event-driven-python-patterns` | `.bob/skills/event-driven-python-patterns/SKILL.md` | AWS Lambda / Azure Functions / GCP Cloud Run handlers, batching, idempotency, DLQ routing |
| `enterprise-integration-adapters` | `.bob/skills/enterprise-integration-adapters/SKILL.md` | Snowflake, Databricks, BigQuery, Kafka, EventBridge, Pub/Sub, Service Bus client protocols |
| `llm-prompt-and-pipeline-patterns` | `.bob/skills/llm-prompt-and-pipeline-patterns/SKILL.md` | LLM invocation pipelines, prompt template management in prompts/, structured outputs, token budgeting |
| `code-quality-and-review` | `.bob/skills/code-quality-and-review/SKILL.md` | Review checklist, severity levels, and the review-findings block format (single source) |

Skill names are flat across all installed repos and must not collide with `bob-cloud-architect` skill names. This mode may load `cloud-architecture-patterns` to understand a pattern but never treats it as the specification; `docs/<id>/` is.

---

## Definition of done

A code generation task is done when:

- [ ] All functions have type annotations and public functions have docstrings.
- [ ] No secrets, URLs, or account identifiers are hardcoded.
- [ ] Every adapter accepts an injectable client (mockable).
- [ ] `ruff check src/` and `mypy --strict src/` pass with zero errors.
- [ ] Structured logging emits `correlation_id` across all processing stages.
- [ ] Every cloud service used appears in `docs/<id>/component-matrix.md`.
- [ ] Unverified SDK facts are listed in `docs/<id>/code/sdk-evidence.md`.
- [ ] Spec acceptance criteria are mapped to evidence in the PR.
