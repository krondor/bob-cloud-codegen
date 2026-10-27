# bob-cloud-codegen

A shareable IBM Bob workspace mode for generating production-ready Python source code for cloud-native, event-driven enterprise systems.

## What this is

The `cloud-codegen` mode gives Bob the role of a senior cloud-native Python engineer. It takes an approved spec plus the [`bob-cloud-architect`](https://github.com/krondor/bob-cloud-architect) deliverables and produces modular, fully typed, fully documented Python source code across event handlers, enterprise data platform adapters, LLM processing, retry/DLQ logic, and observability. A read-only `code-reviewer` mode produces a gap analysis of the result.

## How it works with bob-cloud-architect

Both modes share one spec ID and each owns its own files:

| Path | Owner | cloud-codegen |
|---|---|---|
| `specs/<id>/spec.md` | human | read-only |
| `specs/<id>/{plan,tasks,checkpoint}.md`, `docs/<id>/*.md` | cloud-architect | read-only |
| `specs/<id>/code/`, `docs/<id>/code/` | cloud-codegen | read-write |
| `src/`, `prompts/` | cloud-codegen | read-write |

Start gate: `spec.md` approved, at least one architect task done, every listed input file present. Start a **new session** and point it at the files; do not carry the architecture conversation over. The consumption contract (which tables and columns are read, how `unverified` evidence is treated) is in `.bob/rules-cloud-codegen/04-architect-handoff.md`.

The `edit` permission is limited by a path pattern to `src/`, `prompts/`, `specs/<id>/code/`, and `docs/<id>/code/`. That pattern has not been verified under every Bob runtime, so treat the ownership table as the rule and the pattern as a backstop.

## What it is not

This mode does not design architecture, generate Terraform, or produce test suites. For those, see:
- [`bob-cloud-architect`](https://github.com/krondor/bob-cloud-architect) — architecture design
- `bob-cloud-iac` — Terraform infrastructure as code
- `bob-cloud-testing` — test suite generation

## Install into your workspace

```bash
npx github:krondor/bob-cloud-codegen
```

| Option | Effect |
|---|---|
| `--dry-run` | Print what would change; write nothing |
| `--modes a,b` | Install only the named modes (`cloud-codegen`, `code-reviewer`) |
| `--with-hooks` | Install the ruff/mypy PostToolUse hook and `.bob/settings.json` |
| `--no-agents` | Skip `AGENTS.md` (use when installing alongside `bob-cloud-architect`) |
| `--force` | Replace locally modified files and mode entries |

Installing next to `bob-cloud-architect` in one workspace: install the architect first, then run this installer with `--no-agents`. Mode entries and rules are merged per slug; `skills-lock.json` is merged per skill key. `specs/TEMPLATE/spec.md` is shared and is not overwritten once present.

## Setup

1. Open the workspace folder in Bob and select **Cloud Code Generator** in the mode picker.
2. Reuse the architect's `specs/<id>/spec.md`: add its **Code acceptance criteria** and **Architecture inputs**, then have a human set `Requirements approval`. With no upstream architecture, copy `specs/TEMPLATE/spec.md` and write `Architecture inputs: none`.
3. Check `AGENTS.md` matches your Python version, tools, and approved dependencies.

## Suggested first prompts

- "Read specs/<id>/spec.md, specs/<id>/plan.md, and docs/<id>/component-matrix.md. The architecture is approved; do code-gen for the components in the matrix. Do not re-derive architecture decisions."
- "Resume from specs/<id>/code/checkpoint.md."
- "Implement the next task in specs/<id>/code/tasks.md."

## Code quality standards enforced by this mode

- Type hints on all function signatures
- Docstrings on all modules and public functions
- No hardcoded secrets, endpoints, or account identifiers
- Dependency injection for all external clients (testability)
- Structured JSON logging with consistent fields: `record_id`, `batch_id`, `correlation_id`
- Complete files only — no stubs or placeholders

## Review before use

- **Not yet run against a real engagement.** The installer, mode YAML, and size gates are tested; the end-to-end architect → codegen handoff has not been run live. Expect to tune `04-architect-handoff.md` after the first pilot.
- **Architect deliverables are Markdown tables.** There is no schema, so a renamed column upstream is a silent break. The handoff rule makes the mode look columns up by header and raise an open decision when one is missing.
- **The lint hook is optional and fails open.** Install with `--with-hooks`. It runs `ruff` and `mypy --strict` after a Python file is written and reports findings to the agent; it skips silently if the tools are absent. It reports; it does not block.

## Local customization

Everything below assumes you have cloned this repo locally and are editing it directly — no git workflow required.

### Fill in AGENTS.md

`AGENTS.md` is loaded at the start of every session. Replace every `<!-- TODO -->` block with your workspace context: Python version, tool versions, SDK documentation URLs, approved dependency constraints, org security rules, and DoD items. Keep it short. Reference content (patterns, examples) belongs in rules files.

### Add a skill

A skill is a `SKILL.md` file that Bob loads via `use_skill`. To add one:

1. Create the directory: `.bob/skills/<skill-name>/`
2. Place the `SKILL.md` file inside it — source it from a GitHub raw URL, copy from another repo, or write your own.
3. Register it in the **Skills** table in `AGENTS.md`: name, path, and when to use it.
4. Record the source URL and version in `skills-lock.json` under `"skills"` so it is reproducible.

### Edit or add a rules file

Rules files live in `.bob/rules-cloud-codegen/` and are **all** loaded every session; Bob has no conditional rule loading. Add a rule only if it applies to every task, otherwise put it in a skill. Keep the total under the ceiling in `test/install.test.mjs` (trim wording rather than raising it).

### Enable or modify hooks

```bash
node scripts/install.mjs --with-hooks /path/to/your-project
```

The hook is `.bob/hooks/lint-python.mjs`, registered as a `PostToolUse` hook in `.bob/settings.json`. Hooks only run in a trusted workspace. Test it with a real payload:

```bash
echo '{"cwd":".","tool_input":{"path":"src/example.py"}}' | node .bob/hooks/lint-python.mjs
```

### Update the spec template

The spec template lives in `specs/TEMPLATE/spec.md`, and the code plan, tasks, and checkpoint templates in `specs/TEMPLATE/code/`. Prefer reusing the architect's spec over creating a new one; copy `code/` into `specs/<id>/code/`.

## Contributing via git

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Sources

- Pattern: [krondor/bob-tofu-spacelift](https://github.com/krondor/bob-tofu-spacelift)
