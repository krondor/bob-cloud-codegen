# Contributing to bob-cloud-codegen

Thank you for improving this mode. This guide covers git-based contributions — for local-only customization without git, see [README.md](README.md).

## What belongs here

Good contributions to this repo:

- **Rules improvements** — corrections, additions, or restructuring of files in `.bob/rules-cloud-codegen/`
- **New rules** — only for a constraint that applies to every task; domain knowledge belongs in a skill
- **Hook improvements** — changes to `.bob/hooks/lint-python.mjs`
- **AGENTS.md template improvements** — better placeholder text, missing placeholder sections
- **Installer fixes** — bug fixes or new flags in `scripts/install.mjs`
- **Spec template improvements** — clearer acceptance criteria or missing sections in `specs/TEMPLATE/spec.md`

What does **not** belong here:

- Org-specific or client-specific content (internal SDK URLs, account IDs, proprietary library names)
- Secrets, credentials, or environment-specific configuration
- Application source code — this repo configures Bob, it does not contain the code Bob generates

## Branching

Branch from `main`. Use a short, descriptive branch name:

```
feat/add-async-patterns-rules
fix/hook-graceful-fallback-on-missing-ruff
docs/clarify-agents-md-python-version-placeholder
```

Prefix conventions: `feat/` for new capability, `fix/` for corrections, `docs/` for documentation-only, `refactor/` for restructuring without behavior change.

## Commit messages

Use the conventional commits format:

```
<type>(<scope>): <short summary>

[optional body]
```

Types: `feat`, `fix`, `docs`, `refactor`, `chore`  
Scope: `rules`, `skills`, `hook`, `installer`, `agents-md`, `spec`, `mode-yaml`

Examples:
```
feat(skills): add asyncio patterns to event-driven-python-patterns
fix(hook): skip silently when ruff is not on PATH
docs(spec): add acceptance criterion for OpenTelemetry trace propagation
```

Keep the summary under 72 characters. Use the body to explain *why*, not *what*.

## Pull request scope

Keep PRs focused. One logical change per PR.

Include in the PR description:
- What changed and why
- How to verify (e.g. "Install `--with-hooks` into a Python workspace and confirm ruff runs on `.py` file write")
- Whether the always-loaded size ceilings changed (they should only go down)

## Changing rules

Bob loads every file in `.bob/rules-<slug>/` alphabetically for the active mode; there is no conditional loading, so `<!-- load when -->` headers or dispatch tables do nothing.

1. Add an instruction only if it applies to every task; otherwise it belongs in a skill.
2. Remove a contradiction before adding a rule. Grep both phrasings, including `customInstructions` in `.bob/custom_modes.yaml`.
3. Define each fact once. The review-findings format lives only in the `code-quality-and-review` skill; the error taxonomy and DLQ envelope only in rule 03.
4. Keep always-loaded content under the ceilings in `test/install.test.mjs`. Trim wording rather than raising a ceiling.
5. Do not let a rule or template write a path owned by `bob-cloud-architect` (see `04-architect-handoff.md`).

## Modifying the lint hook

`.bob/hooks/lint-python.mjs` is a `PostToolUse` hook. Principles to preserve:

- Always exit 0: `PostToolUse` cannot block, and a hook error must never break an edit.
- Skip non-Python files, missing files, and uninstalled tools silently.
- Read the path from `tool_input.path`; report findings on stdout, which Bob appends beside the tool result.

Test it with the real payload shape:

```bash
echo '{"cwd":".","tool_input":{"path":"README.md"}}' | node .bob/hooks/lint-python.mjs   # silent, exit 0
echo '{"cwd":".","tool_input":{"path":"src/example.py"}}' | node .bob/hooks/lint-python.mjs
```

## Adding or updating a skill

1. Place the file at `.bob/skills/<skill-name>/SKILL.md` with `name`, `version`, `description`, and `when_to_use` front matter.
2. Pick a name that does not collide with any `bob-cloud-architect` skill (the namespace is flat).
3. Add an entry to `skills-lock.json`; its `version` must equal the front matter (test-enforced).
4. Add a row to the **Skills** table in `AGENTS.md`.
5. Cite a doc URL and check date for every vendor or SDK claim. No unverifiable model names or SDK signatures.

To update a skill, bump `version` in both the file and `skills-lock.json` together.

## Validation before opening a PR

```bash
npm test
node scripts/install.mjs --dry-run /tmp/test-workspace
```

## Review expectations

PRs are reviewed for:
- Accuracy of Python, cloud SDK, and observability claims in rules files
- Consistency with existing rules style (concise, prescriptive, no prose padding)
- No fact defined in two places; no rule that only applies to some tasks
- Hook changes preserve always-exit-0 behavior
- No org-specific or client-specific content
- `skills-lock.json` updated if a skill was added or changed
