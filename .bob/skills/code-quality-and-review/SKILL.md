---
name: code-quality-and-review
version: 0.2.0
description: Review checklist, P0/P1/P2 severity criteria, and the review-findings block format for generated Python source. Single home of the findings format used by code-reviewer and cloud-codegen.
when_to_use: Use when reviewing generated Python source code or self-checking a module against the quality gates before handoff, in cloud-codegen or code-reviewer mode.
---

# Code Quality and Review Checklist

Verification framework for generated Python. The standards themselves live in the always-loaded rules
(`02-code-quality-standards.md`, `03-error-handling-and-retries.md`); this skill is how to check them.

## Skill navigation

| Section | Description |
|---|---|
| [Review checklist](#review-checklist) | Category-by-category verification items |
| [Severity levels](#severity-levels) | P0, P1, P2 criteria |
| [Review findings block format](#review-findings-block-format) | The only definition of the findings format |
| [Anti-patterns](#anti-patterns) | High-risk coding patterns to flag |
| [Grounding sources](#grounding-sources) | Reference links and verification dates |

---

## Review checklist

### 1. Typing and interfaces
- [ ] Every function and method has complete argument and return type annotations.
- [ ] No bare `Any` without an explanatory comment.
- [ ] External clients adhere to a `Protocol` or abstract base.
- [ ] Passes `mypy --strict` with no unjustified `# type: ignore`.

### 2. Error handling and DLQ
- [ ] No bare `except:` or `except Exception: pass`.
- [ ] Exceptions are separated into permanent, transient, and fatal (rule 03).
- [ ] Transient errors use exponential backoff with jitter.
- [ ] DLQ envelope matches the one in rule 03.

### 3. Modularity and mockability
- [ ] External clients are injected via constructor or parameters.
- [ ] No global mutable state or module-level client instantiation.
- [ ] Functions are single-responsibility and testable in isolation.

### 4. Observability and security
- [ ] Structured JSON logging with `correlation_id`, `batch_id`, and `record_id` where applicable.
- [ ] No hardcoded secrets, connection strings, or account numbers.
- [ ] Sensitive fields and raw model prompts/completions are masked or omitted from logs.

### 5. Architecture conformance
- [ ] Every cloud service used appears in `docs/<id>/component-matrix.md`.
- [ ] IAM, encryption, and secret handling match `docs/<id>/security-design.md`.
- [ ] Calls resting on `unverified` or `stale` SDK facts are flagged `# re-verify against SDK version` and listed in `docs/<id>/code/sdk-evidence.md`.

---

## Severity levels

- **P0 (blocker):** hardcoded credential or endpoint; concrete client instantiated in business logic; exception swallowed with no log or DLQ; missing type annotations or docstrings on public API; service or IAM choice contradicting the approved architecture.
- **P1 (high):** missing retry or DLQ envelope on an external call; unhandled transient error; non-structured logging; unflagged unverified SDK call.
- **P2 (medium):** missing type hint on an internal helper; non-standard field naming.

---

## Review findings block format

Emit exactly one block:

````markdown
review-findings (paste into docs/<spec-id>/code/review-findings.md)

### Review findings: <spec-id> / <module-name>

| Severity | Category | File & Line | Finding | Remediation |
|---|---|---|---|---|
| P0 | Mockability | `src/handlers/process.py:22` | Direct instantiation `boto3.client("s3")` | Pass `s3_client: S3ClientProtocol` into constructor |
| P1 | Error handling | `src/adapters/queue.py:55` | Retry loop lacks jitter | Add random jitter |

**Open decisions / follow-ups:**
1. [P0] ...
````

Use plain `P0`/`P1`/`P2` in the Severity column. List every gap as an open decision; never omit silently.

---

## Anti-patterns

- **God modules:** one file over 500 lines mixing transport, business logic, and persistence.
- **Hidden side effects:** mutating incoming records in place instead of returning new objects.
- **Unstructured prints:** `print(f"Error: {e}")` instead of a structured logger.

---

## Grounding sources

- [PEP 484 — Type Hints](https://peps.python.org/pep-0484/) — verified: 2026-03-30
- [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html) — verified: 2026-03-30
- [Mypy Documentation](https://mypy.readthedocs.io/en/stable/) — verified: 2026-03-30
