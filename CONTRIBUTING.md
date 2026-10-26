# Contributing to bob-cloud-codegen

Thank you for improving this mode. This guide covers git-based contributions — for local-only customization without git, see [README.md](README.md).

## What belongs here

Good contributions to this repo:

- **Rules improvements** — corrections, additions, or restructuring of files in `.bob/rules-cloud-codegen/`
- **New rules domains** — a new numbered rules file for a gap in current coverage (e.g. async patterns, streaming, multi-cloud SDK differences)
- **Hook improvements** — changes to `.bob/hooks/pre-edit.mjs` (new checks, better error messages, graceful fallback improvements)
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
Scope: `rules`, `hook`, `installer`, `agents-md`, `spec`, `mode-yaml`

Examples:
```
feat(rules): add 09-async-patterns rules file for asyncio event loop patterns
fix(hook): exit 0 when ruff is not on PATH instead of crashing
docs(spec): add acceptance criterion for OpenTelemetry trace propagation
```

Keep the summary under 72 characters. Use the body to explain *why*, not *what*.

## Pull request scope

Keep PRs focused. One logical change per PR.

Include in the PR description:
- What changed and why
- How to verify (e.g. "Install `--with-hooks` into a Python workspace and confirm ruff runs on `.py` file write")
- Whether the dispatch table in `custom_modes.yaml` was updated (required when adding a rules file)

## Adding a rules file

1. Create `.bob/rules-cloud-codegen/NN-<name>.md` using the next available two-digit prefix.
2. Start the file with `<!-- load when: <condition> -->` on the first line.
3. Add a matching entry to the dispatch table in `.bob/custom_modes.yaml` under `customInstructions`.
4. Include the new file in your PR with a brief explanation of what gap it fills.

## Modifying the pre-edit hook

The hook at `.bob/hooks/pre-edit.mjs` runs before every Python file write. Principles to preserve:

- Fail open: if a required tool (`ruff`, `mypy`) is not installed, exit 0 and allow the edit
- Non-Python files must pass through without running any checks
- Error output goes to stderr; exit code 0 = allow, non-zero = block

After changing the hook, test it manually:
```bash
echo '{"path": "src/handler.py"}' | node .bob/hooks/pre-edit.mjs
echo '{"path": "README.md"}' | node .bob/hooks/pre-edit.mjs
```

## Adding or updating a skill

1. Place the file at `.bob/skills/<skill-name>/SKILL.md`.
2. Add an entry to `skills-lock.json` with the source URL and version or commit hash.
3. Add a row to the **Skills** table in `AGENTS.md`.
4. PR description should include where the skill came from and why it adds value to this specific mode.

To update a vendored skill, replace the file and update the `skills-lock.json` entry.

## Validation before opening a PR

```bash
# Dry-run the installer against a temp workspace
node scripts/install.mjs --dry-run /tmp/test-workspace

# Test hook with a Python file path
echo '{"path": "src/example.py"}' | node .bob/hooks/pre-edit.mjs

# Test hook with a non-Python file (should exit 0 silently)
echo '{"path": "README.md"}' | node .bob/hooks/pre-edit.mjs
```

## Review expectations

PRs are reviewed for:
- Accuracy of Python, cloud SDK, and observability claims in rules files
- Consistency with existing rules style (concise, prescriptive, no prose padding)
- Correct `<!-- load when: ... -->` header on any new rules file
- Dispatch table updated if a new rules file was added
- Hook changes preserve fail-open behavior
- No org-specific or client-specific content
- `skills-lock.json` updated if a skill was added or changed
