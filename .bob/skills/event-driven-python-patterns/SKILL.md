---
name: event-driven-python-patterns
version: 0.1.0
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
```python
"""AWS Lambda SQS/EventBridge event handler."""
from __future__ import annotations
import logging
from typing import Any, Mapping
from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)

class EventRecord(BaseModel):
    record_id: str
    payload: dict[str, Any]
    correlation_id: str

def lambda_handler(event: Mapping[str, Any], context: Any) -> dict[str, Any]:
    """Process incoming batch of event records."""
    batch_item_failures: list[dict[str, str]] = []
    records = event.get("Records", [])
    
    for record in records:
        msg_id = record.get("messageId", "unknown")
        try:
            # Process individual record
            process_record(record["body"])
        except ValidationError as exc:
            logger.error("Permanent schema validation error for message %s: %s", msg_id, exc)
            # Route to DLQ or mark for failure handling
            batch_item_failures.append({"itemIdentifier": msg_id})
        except Exception as exc:
            logger.exception("Transient failure for message %s: %s", msg_id, exc)
            batch_item_failures.append({"itemIdentifier": msg_id})

    return {"batchItemFailures": batch_item_failures}

def process_record(body_raw: str) -> None:
    """Business logic per record with injected dependencies."""
    pass
```

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

- Wrap messages in a consistent envelope containing original payload, failure reason, stack trace, timestamp, and retry count.
- Emit structured metric on DLQ publication (`Metric: DLQMessageCount`, tags: `source`, `error_type`).

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
