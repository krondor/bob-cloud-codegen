# spec.md

**Spec ID:** <!-- e.g. 001-event-handler-codegen -->
**Mode:** cloud-codegen
**Status:** draft
**Requirements approval:** pending
**Profile:** none
**Created:** <!-- YYYY-MM-DD -->
**Author:** <!-- name -->

---

## Business problem

<!-- What Python components or modules are being implemented in this spec?
     Reference the approved architecture document or component-matrix.md.
     Describe what the generated code must do functionally. -->

---

## Scope

**In scope:**
<!-- List the src/ modules, prompt templates, or adapters this spec covers.
     Example: event handlers, validation service, enterprise adapters for Snowflake and SQS,
     retry and DLQ logic, observability module. -->

**Out of scope:**
<!-- List what is explicitly excluded.
     Examples: Terraform (cloud-iac mode), test execution suites (cloud-testing mode),
     architecture decisions ([cloud-architect mode](https://github.com/krondor/bob-cloud-architect)). -->

---

## Target cloud(s)

<!-- Specify: AWS / Azure / GCP -->

---

## Architecture inputs

<!-- List the architecture artifacts this spec depends on.
     Examples: docs/<spec-id>/component-matrix.md, data models, API contracts. -->

---

## Constraints

<!-- List hard constraints on the generated code.
     Examples: Python >= 3.11, approved libraries (Pydantic v2, boto3, etc.), no hardcoded secrets,
     must use dependency injection for all external clients, structured JSON logging. -->

---

## Acceptance criteria

The code generation task is complete when all of the following are satisfied:

- [ ] All specified modules in `src/` are fully implemented with no placeholders.
- [ ] All functions and methods have type hints and docstrings.
- [ ] No hardcoded secrets, endpoints, or account identifiers.
- [ ] All external clients are injectable and mockable.
- [ ] Structured logging with `correlation_id` propagated throughout.
- [ ] Error handling differentiates permanent vs transient errors with DLQ wrapping.
- [ ] Passes `mypy --strict` and `ruff check`.

---

## Open decisions

| # | Decision | Owner | Target date | Status |
|---|---|---|---|---|
| 1 | <!-- Unresolved question blocking code generation --> | <!-- --> | <!-- --> | open |
