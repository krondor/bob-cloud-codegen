# Architect Handoff

Consume `bob-cloud-architect` outputs as inputs. Never re-derive architecture decisions recorded there.
Work from files only; ignore any prior architecture conversation.

## Start gate

Do not read further or write code until all hold:

1. `specs/<id>/spec.md` has `Requirements approval: approved by …` for its current revision.
2. `specs/<id>/tasks.md` (architect-owned) has at least one task marked done.
3. Every file listed under the spec's `Architecture inputs` exists. If the spec says `none`, work from
   the spec alone and record that in `code/plan.md`.

If a condition fails, say which one and stop.

## Inputs

| File | Take from it | Never take from it |
|---|---|---|
| `specs/<id>/plan.md` | target clouds, approved service families | narrative rationale |
| `docs/<id>/component-matrix.md` | verified service name, capability, cloud, API family, region constraints | Cost Model, Rationale columns |
| `docs/<id>/security-design.md` | IAM roles, encryption, secrets approach, audit log targets | prose |
| `docs/<id>/evidence-register.md` | rows with status `verified` only | `unverified`, `stale`, `from-skill` rows as facts |
| `specs/<id>/checkpoint.md` | spec revision, blockers | — |

## Reading Markdown tables

- Locate columns by header text, never by position. If an expected column or file is missing or
  renamed, add an open decision to `code/plan.md` and stop work that depends on it.
- Use a service only if it appears in the component matrix. Any other service is an open decision.
- `unverified` and `stale` evidence become open decisions, not assumptions. Do not use Mermaid
  diagrams as a source.

## File ownership

| Path | Owner | This mode |
|---|---|---|
| `specs/<id>/spec.md` | human | read-only |
| `specs/<id>/{plan,tasks,checkpoint}.md`, `docs/<id>/*.md` | cloud-architect | read-only |
| `specs/<id>/code/{plan,tasks,checkpoint}.md` | this mode | read-write |
| `docs/<id>/code/` (`review-findings.md`, `sdk-evidence.md`) | this mode | read-write |
| `src/`, `prompts/` | this mode | read-write |

The edit permission blocks the architect's paths by pattern only; honour this table even where the
tooling would allow a write. A needed change to an architect-owned file is an open decision for the
human, not an edit.
