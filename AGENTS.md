# AGENTS.md

Shared operating contract for humans and agents working in this repository with the `cloud-codegen` and `code-reviewer` Bob modes.
Keep it short, accurate, and reviewed like code. Update it when conventions change or a recurring correction is discovered.
**Do not store secrets, personal data, or real account names here.**

---

## Purpose of this mode

This workspace provides two Bob modes:

- **`cloud-codegen`** — generates modular, production-ready Python source code (`src/`) and prompt templates (`prompts/`) for cloud-native, event-driven enterprise systems from approved architecture specs. No architecture diagrams, Terraform, or full test suites.
- **`code-reviewer`** — read-only gap analysis of generated Python code against typing, docstrings, error handling, mockability, structured logging, and security standards. Does not write files or modify code.

**Workspace layout:**

```
specs/          Spec-driven work: spec.md, plan.md, tasks.md, checkpoint.md per component or feature
src/            Generated Python source code (agent output)
prompts/        Versioned LLM prompt templates (agent output)
docs/<spec-id>/ Architecture deliverables produced upstream (input to this mode)
.bob/           Bob config: custom modes, rules, skills, MCP example
```

A `checkpoint.md` file in each spec folder records the session state so work can resume across sessions or mode switches without re-reading the entire history: spec revision, completed artifacts, blockers, validation status, and the next action.

---

## Spec-driven workflow

All code generation is spec-driven. No code is written until a spec exists and a human has approved its requirements.

1. **Specify** (`specs/<NNN-name>/spec.md`): component requirements, interface contracts, data formats, error handling expectations, and testable acceptance criteria. If no spec exists, the agent drafts one (status `draft`, approval `pending`). Only a human sets approval.
2. **Plan** (`specs/<NNN>/plan.md`): implementation approach, module breakdown, dependencies, integration adapter design.
3. **Tasks** (`specs/<NNN>/tasks.md`): ordered implementation checklist — each item one reviewable module or file.
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
| `node` | `>= 18` | For Bob installer and hooks |

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

The agent grounds integration adapter patterns in the official SDK documentation for each data platform and cloud service. When MCP documentation servers are configured (`.bob/mcp.json`), it consults live documentation before generating client calls.

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
| `code-quality-and-review` | `.bob/skills/code-quality-and-review/SKILL.md` | Quality review checklist, static typing gates, docstring standards, P0/P1 review finding criteria |

---

## Definition of done

A code generation task is done when:

- [ ] All functions have type annotations and public functions have docstrings.
- [ ] No secrets, URLs, or account identifiers are hardcoded.
- [ ] Every adapter accepts an injectable client (mockable).
- [ ] `ruff check src/` and `mypy --strict src/` pass with zero errors.
- [ ] Structured logging emits `correlation_id` across all processing stages.
- [ ] Spec acceptance criteria are mapped to evidence in the PR.
