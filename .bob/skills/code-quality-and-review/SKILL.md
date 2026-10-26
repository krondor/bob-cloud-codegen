---
name: code-quality-and-review
version: 0.1.0
description: Quality review checklist, static typing gates (mypy strict), docstring standards, error handling verification, mockability checks, and P0/P1 review finding criteria for Python source code.
when_to_use: Use when reviewing generated Python source code or conducting a pre-handoff code quality audit in cloud-codegen or code-reviewer mode.
---

# Code Quality and Review Checklist

Systematic verification framework for reviewing Python source code against enterprise reliability, security, and testability standards.

## Skill navigation

| Section | Description |
|---|---|
| [Review checklist](#review-checklist) | Category-by-category verification items |
| [P0 blocker criteria](#p0-blocker-criteria) | Non-negotiable quality criteria that block merge |
| [Review findings block format](#review-findings-block-format) | Markdown format for findings handoff |
| [Anti-patterns](#anti-patterns) | High-risk coding patterns to flag |
| [Grounding sources](#grounding-sources) | Reference links and verification dates |

---

## Review checklist

### 1. Typing and interfaces
- [ ] Every function and method has complete argument and return type annotations.
- [ ] No bare `Any` types without explanatory comments.
- [ ] External clients adhere to abstract `Protocol` or base classes.
- [ ] Passes `mypy --strict` without suppression comments (`# type: ignore`) unless specifically justified.

### 2. Error handling & DLQ
- [ ] No bare `except:` or `except Exception: pass`.
- [ ] Exceptions are differentiated into permanent, transient, and fatal.
- [ ] Transient errors have exponential backoff with jitter.
- [ ] DLQ envelope contains message body, error type, message, timestamp, and correlation id.

### 3. Modularity & mockability
- [ ] External clients are injected via constructor or method parameters.
- [ ] No global mutable state or module-level client instantiation.
- [ ] Functions are single-responsibility and easily unit-testable in isolation.

### 4. Observability & security
- [ ] Structured JSON logging with `correlation_id`, `batch_id`, and `record_id`.
- [ ] Zero hardcoded secrets, connection strings, or account numbers.
- [ ] Sensitive fields masked in log output.

---

## P0 blocker criteria

Mark as **P0** in review findings if any of the following are observed:
1. Hardcoded secret, password, or AWS/Azure/GCP credential.
2. Direct instantiation of concrete cloud/database clients in business logic without injection mechanism.
3. Bare exception swallowing that drops failed records without logging or DLQ publishing.
4. Missing type annotations on public module APIs.
5. Missing docstrings on public classes or functions.

---

## Review findings block format

```markdown
### Review findings: <spec-id> / <module-name>

| Severity | Category | File & Line | Finding | Remediation |
|---|---|---|---|---|
| **[P0]** | Mockability | `src/handlers/process.py:22` | Direct instantiation `boto3.client("s3")` | Pass `s3_client: S3ClientProtocol` into constructor |
| **[P1]** | Error handling | `src/adapters/queue.py:55` | Retry loop lacks jitter | Add random jitter to avoid thundering herd |

**Open decisions / follow-ups:**
1. [P0] ...
```

---

## Anti-patterns

- **God modules:** Single file exceeding 500 lines combining transport, business logic, and database operations.
- **Hidden side effects:** Modifying incoming dictionary records in-place rather than returning new immutable objects.
- **Unstructured prints:** Using `print(f"Error: {e}")` instead of structured logger.

---

## Grounding sources

- [PEP 484 — Type Hints](https://peps.python.org/pep-0484/) — verified: 2026-03-30
- [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html) — verified: 2026-03-30
- [Mypy Documentation](https://mypy.readthedocs.io/en/stable/) — verified: 2026-03-30
