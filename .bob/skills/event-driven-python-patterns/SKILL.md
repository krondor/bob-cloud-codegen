---
name: event-driven-python-patterns
version: 0.2.0
description: Event-driven Python patterns covering AWS Lambda, Azure Functions, GCP Cloud Run, SQS/SNS, EventBridge, Pub/Sub, Service Bus handlers, batching, idempotency, and DLQ routing.
when_to_use: Use when generating Python event handlers, queue consumers, batch processors, stream listeners, or dead-letter queue routing logic.
---

# Event-Driven Python Patterns

Architectural patterns and implementation templates for serverless and containerized event-driven Python runtimes.

## Skill navigation

| Section | Description |
|---|---|
| [Serverless handler patterns](#serverless-handler-patterns) | AWS Lambda, Azure Functions, GCP Cloud Run function entry points |
| [Batch processing & idempotency](#batch-processing--idempotency) | Partial batch responses, deduplication keys, atomic commits |
| [DLQ and redrive routing](#dlq-and-redrive-routing) | Standard error envelope, dead-letter publishing |
| [Anti-patterns](#anti-patterns) | Common event-driven implementation mistakes to avoid |
| [Grounding sources](#grounding-sources) | Reference links and verification dates |

---

## Serverless handler patterns

### AWS Lambda standard handler

Error classes (`PermanentError`, `TransientError`) and the DLQ envelope come from rule 03. Permanent
errors are published to the DLQ and acknowledged; transient errors are reported as batch item failures
so the queue retries them. Dependencies are injected; the entry point only wires them.

```python
"""AWS Lambda SQS handler with partial batch response."""
from __future__ import annotations
import logging
from typing import Any, Callable, Mapping, Protocol

from errors import PermanentError, TransientError  # rule 03 taxonomy

logger = logging.getLogger(__name__)


class DeadLetterPublisher(Protocol):
    """Publishes a rejected record, wrapped in the rule 03 envelope, to the DLQ."""

    def publish(self, body: str, exc: Exception, correlation_id: str) -> None: ...


def handle_batch(
    event: Mapping[str, Any],
    process_record: Callable[[str], None],
    dlq: DeadLetterPublisher,
) -> dict[str, list[dict[str, str]]]:
    """Process an SQS batch, returning only the failed items for retry.

    Args:
        event: SQS event containing a ``Records`` list.
        process_record: Business logic for one record body.
        dlq: Publisher for permanently rejected records.

    Returns:
        A ``batchItemFailures`` mapping listing transient failures only.
    """
    failures: list[dict[str, str]] = []
    for record in event.get("Records", []):
        msg_id = str(record.get("messageId", "unknown"))
        extra = {"correlation_id": msg_id, "record_id": msg_id}
        try:
            process_record(record["body"])
        except PermanentError as exc:
            logger.error("permanent failure, routing to DLQ", extra=extra)
            dlq.publish(record["body"], exc, msg_id)
        except TransientError:
            logger.warning("transient failure, will retry", extra=extra)
            failures.append({"itemIdentifier": msg_id})
    return {"batchItemFailures": failures}
```

Unexpected exceptions are deliberately not caught: they surface to the runtime instead of being
silently classified. The Lambda entry point (`lambda_handler`) builds the real dependencies once and
calls `handle_batch`.

### Azure Functions & GCP Cloud Run patterns
- **Azure Functions:** Use `azure.functions.QueueMessage` or `EventGridEvent` bindings with typed input models. Return explicit status.
- **GCP Cloud Run / Eventarc:** Use `functions_framework.cloud_event` with CloudEvents SDK.

---

## Batch processing & idempotency

1. **Idempotency keys:** Derive a unique key from `source_system + entity_id + version` or hash of business payload.
2. **Deduplication store:** Check and set idempotency key in cache (e.g. DynamoDB, Redis, Cosmos DB) with a TTL (e.g. 24 hours).
3. **Partial batch failure reporting:** Always return `batchItemFailures` rather than failing the entire batch, preventing unnecessary reprocessing of successful messages.

---

## DLQ and redrive routing

- Use the single DLQ envelope defined in rule 03; do not define a second shape.
- Emit a structured metric on DLQ publication (`DLQMessageCount`, tags: `source`, `error_type`).

---

## Anti-patterns

- **Catch-all silent pass:** `except Exception: pass` hides data loss and breaks reconciliation.
- **Whole-batch failure:** Throwing an unhandled exception at the top level when 1 of 100 messages failed forces 99 successful messages to be re-processed.
- **Hardcoded timeout values:** Relying on default SDK timeouts rather than explicitly configured connection and read timeouts.

---

## Grounding sources

- [AWS Lambda SQS Batch Failures](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html) — verified: 2026-03-30
- [Azure Functions Queue Storage](https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-storage-queue-trigger) — verified: 2026-03-30
- [Google CloudEvents Python SDK](https://github.com/cloudevents/sdk-python) — verified: 2026-03-30
