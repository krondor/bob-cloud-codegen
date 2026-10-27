# plan.md (code)

<!-- Owned by cloud-codegen. Lives at specs/<id>/code/plan.md. Never edit the architect's specs/<id>/plan.md. -->

## Implementation approach

<!-- Module hierarchy, dependency injection strategy, adapter design, prompt template design (if any).
     Do not restate architecture rationale; reference the architect files instead. -->

## Component → module mapping

<!-- One row per component in docs/<id>/component-matrix.md that this spec implements. -->

| Component (matrix row) | Cloud | Service (verified) | Module | Notes |
|---|---|---|---|---|
| <!-- e.g. Validator --> | <!-- AWS --> | <!-- name from matrix --> | `src/handlers/validate.py` | |

## Module breakdown

| Module | File path | Dependencies | Description |
|---|---|---|---|
| Domain models | `src/models/records.py` | `pydantic` | Strongly-typed payload and event definitions |
| Errors | `src/errors.py` | none | `DomainError`, `PermanentError`, `TransientError`, `FatalError` (rule 03) |
| Adapter | `src/adapters/<target>.py` | SDK / Protocol | Injectable external client wrapper |

## Error handling & DLQ plan

<!-- Transient vs permanent error mapping and DLQ envelope strategy (rule 03). -->

## Open decisions

<!-- Missing or renamed architect inputs, unverified evidence rows, unverified SDK facts, review gaps. -->

| # | Decision | Options | Recommended | Status |
|---|---|---|---|---|
| 1 | <!-- Decision topic --> | <!-- A vs B --> | <!-- Choice --> | open |
