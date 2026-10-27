# plan.md

## Implementation approach

<!-- High-level design for implementing the components in this spec:
     - Module hierarchy and package organization
     - Dependency injection strategy
     - Integration adapter design
     - Prompt template design (if applicable) -->

## Module breakdown

| Module | File path | Dependencies | Description |
|---|---|---|---|
| Domain models | `src/models/records.py` | `pydantic` | Strongly-typed payload and event definitions |
| Event handler | `src/handlers/process.py` | `models`, adapters | Batch processor and dispatch logic |
| Adapter | `src/adapters/<target>.py` | SDK / Protocol | Injectable external client wrapper |

## Error handling & DLQ plan

<!-- Transient vs permanent error mapping and DLQ envelope strategy -->

## Open decisions

| # | Decision | Options | Recommended | Status |
|---|---|---|---|---|
| 1 | <!-- Decision topic --> | <!-- A vs B --> | <!-- Choice --> | open |
