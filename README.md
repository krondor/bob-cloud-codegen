# bob-cloud-codegen

A shareable IBM Bob workspace mode for generating production-ready Python source code for cloud-native, event-driven enterprise systems.

## What this is

The `cloud-codegen` mode gives Bob the role of a senior cloud-native Python engineer. It takes an approved architecture document and produces modular, fully typed, fully documented Python source code across event handlers, enterprise data platform adapters, LLM processing, retry/DLQ logic, reconciliation, and observability.

## What it is not

This mode does not design architecture, generate Terraform, or produce test suites. For those, see:
- `bob-cloud-architect` — architecture design
- `bob-cloud-iac` — Terraform infrastructure as code
- `bob-cloud-testing` — test suite generation

## Install into your workspace

```bash
npx github:krondor/bob-cloud-codegen
```

| Option | Effect |
|---|---|
| `--dry-run` | Print what would change; write nothing |
| `--with-templates` | Also copy `AGENTS.md` if it does not already exist |
| `--force` | Replace an existing `cloud-codegen` block in `custom_modes.yaml` |

## Setup

1. Open the workspace folder in Bob and select **Cloud Code Generator** in the mode picker.
2. Fill in `AGENTS.md` — provide the architecture document location, target cloud(s), Python version, data platform details, and approved dependencies.
3. Ensure the approved architecture document exists at the path referenced in `AGENTS.md`.

## Suggested first prompts

- "Review AGENTS.md and specs/ and tell me what spec is active and what the next task is."
- "The spec is in specs/TEMPLATE/spec.md — start with plan.md."
- "Implement the next task in tasks.md."
- "Generate the event handler module per the current spec."

## Code quality standards enforced by this mode

- Type hints on all function signatures
- Docstrings on all modules and public functions
- No hardcoded secrets, endpoints, or account identifiers
- Dependency injection for all external clients (testability)
- Structured JSON logging with consistent fields: `record_id`, `batch_id`, `correlation_id`
- Complete files only — no stubs or placeholders

## Review before use

- **Not yet run against a real engagement.** Mode YAML syntax has been validated; first pilot run is the real test.
- **AGENTS.md has placeholder sections.** Fill them in, including the architecture document location, before running any code generation session.
- **Hooks (ruff, mypy) ship with this repo.** Copy `.bob/hooks/` and `.bob/settings.json` into your workspace (or use `scripts/install.mjs --with-hooks`). Requires `ruff` and `mypy` installed in the Python environment.

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

Rules files live in `.bob/rules-cloud-codegen/`. Each file begins with `<!-- load when: ... -->`. Edit any file freely.

To add a new rules domain (e.g. async patterns):
1. Create `.bob/rules-cloud-codegen/09-async-patterns.md` with a `<!-- load when: ... -->` header.
2. Add a matching entry in the dispatch table inside `.bob/custom_modes.yaml` under `customInstructions`.

### Enable or modify hooks

The repo ships a pre-edit hook at `.bob/hooks/pre-edit.mjs` that runs `ruff check` and `mypy --strict` before every Python file write. To enable it in your workspace:

```bash
node scripts/install.mjs --with-hooks /path/to/your-project
```

Or manually copy `.bob/hooks/` and `.bob/settings.json` into your workspace and trust the workspace in Bob. To change what the hook checks, edit `.bob/hooks/pre-edit.mjs` directly.

### Update the spec template

The spec template lives in `specs/TEMPLATE/spec.md`. Copy it to a new directory (e.g. `specs/my-project/`) and fill it in before starting a code generation session.

## Contributing via git

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Sources

- Pattern: [krondor/bob-tofu-spacelift](https://github.com/krondor/bob-tofu-spacelift)
