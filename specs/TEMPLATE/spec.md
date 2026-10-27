# spec.md

<!-- If bob-cloud-architect already produced specs/<id>/spec.md, reuse it: do not create a second spec.
     Add the "Code acceptance criteria" below to it (a human edit, then re-approve). This template is
     for a spec that has no upstream architecture. -->

**Spec ID:** <!-- same ID as the architect spec, e.g. 001-event-platform-arch -->
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

<!-- List the files this spec depends on, or write "none" if there is no upstream architecture.
     Typical: specs/<id>/plan.md, docs/<id>/component-matrix.md, docs/<id>/security-design.md,
     docs/<id>/evidence-register.md. The mode stops if a listed file is missing. -->

---

## Constraints

<!-- List hard constraints on the generated code.
     Examples: Python >= 3.11, approved libraries (Pydantic v2, boto3, etc.), no hardcoded secrets,
     must use dependency injection for all external clients, structured JSON logging. -->

---

## Code acceptance criteria

The code generation task is complete when the standards in `AGENTS.md` (Definition of done) hold and:

- [ ] All specified modules in `src/` are fully implemented with no placeholders.
- [ ] Every cloud service used appears in `docs/<id>/component-matrix.md`.
- [ ] <!-- add one checkbox per module-specific behavior to prove -->

---

## Open decisions

| # | Decision | Owner | Target date | Status |
|---|---|---|---|---|
| 1 | <!-- Unresolved question blocking code generation --> | <!-- --> | <!-- --> | open |
