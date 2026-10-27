---
name: enterprise-integration-adapters
version: 0.2.0
description: Python client adapter patterns for Snowflake, Databricks, BigQuery, Kafka, EventBridge/SQS, Cloud Pub/Sub, Azure Service Bus, and Apache Iceberg with dependency injection and mockability. Pattern guidance only; SDK facts must be verified per rule 05.
when_to_use: Use when implementing Python adapters or client wrappers connecting to external enterprise data platforms, message buses, or analytics systems.
---

# Enterprise Integration Adapters

Design patterns and abstract protocol definitions for enterprise data platform and messaging adapters in Python.

## Skill navigation

| Section | Description |
|---|---|
| [Adapter interface contracts](#adapter-interface-contracts) | Protocol definitions and dependency injection patterns |
| [Data platform adapters](#data-platform-adapters) | Snowflake, Databricks, BigQuery, Iceberg |
| [Messaging bus adapters](#messaging-bus-adapters) | Kafka, EventBridge, Pub/Sub, Service Bus |
| [Anti-patterns](#anti-patterns) | Critical integration traps to avoid |
| [Grounding sources](#grounding-sources) | Reference links and verification dates |

---

## Adapter interface contracts

Always define a `Protocol` or `ABC` interface for every adapter before writing the concrete client implementation:

```python
"""Storage and database adapter protocols."""
from __future__ import annotations
from typing import Any, Protocol, Sequence

class RecordPublisher(Protocol):
    """Protocol for publishing event records to a message bus."""
    def publish(self, topic: str, message: dict[str, Any], correlation_id: str) -> str:
        ...

    def publish_batch(self, topic: str, messages: Sequence[dict[str, Any]], correlation_id: str) -> list[str]:
        ...

class WarehouseWriter(Protocol):
    """Protocol for inserting analytical records into a data warehouse."""
    def insert_records(self, table: str, records: Sequence[dict[str, Any]]) -> int:
        ...
```

### Injectable concrete adapter

The concrete adapter takes an already-built SDK client; a factory builds the real one at the edge.
Wrap SDK exceptions into the rule 03 taxonomy here.

```python
"""SQS publisher adapter."""
from __future__ import annotations
import json
from typing import Any

from botocore.exceptions import ClientError  # re-verify against SDK version

from errors import PermanentError, TransientError  # rule 03 taxonomy

_RETRYABLE_CODES = frozenset({"ThrottlingException", "ServiceUnavailable", "RequestTimeout"})  # re-verify


class SqsPublisher:
    """Publishes JSON messages to one SQS queue using an injected boto3-style client."""

    def __init__(self, client: Any, queue_url: str) -> None:
        self._client = client  # injected; never created here
        self._queue_url = queue_url  # from configuration, never a literal

    def publish(self, message: dict[str, Any], correlation_id: str) -> str:
        """Send one message and return its message id.

        Args:
            message: JSON-serialisable payload.
            correlation_id: Propagated into the message attributes and logs.

        Raises:
            TransientError: Throttling or service unavailability; retry with backoff.
            PermanentError: The request was rejected as invalid.
        """
        try:
            response = self._client.send_message(  # re-verify against SDK version
                QueueUrl=self._queue_url,
                MessageBody=json.dumps(message),
                MessageAttributes={"correlation_id": {"DataType": "String", "StringValue": correlation_id}},
            )
        except ClientError as exc:
            code = str(exc.response.get("Error", {}).get("Code", ""))
            if code in _RETRYABLE_CODES:
                raise TransientError(code) from exc
            raise PermanentError(code) from exc
        return str(response["MessageId"])
```

---

## Data platform adapters

### Snowflake client pattern
- Use `snowflake-connector-python` or SQLAlchemy Snowflake dialect.
- Wrap connections in context managers to guarantee connection pooling and closure.
- Support key-pair authentication and OAuth; reject embedded passwords in code or config.

### Databricks SQL client pattern
- Use `databricks-sql-connector`.
- Ground credentials in personal access token (PAT) or Azure AD / GCP OAuth token from secret manager.

### BigQuery client pattern
- Use `google-cloud-bigquery`.
- Implement parameterized queries and streaming inserts (`insert_rows_json`) with schema validation.

### Apache Iceberg pattern
- Use `pyiceberg` against a catalog configured from environment or secret manager; never embed catalog URIs or credentials.
- Prefer a REST catalog with vended storage credentials over long-lived storage keys, if the approved architecture specifies one.
- Write through a `WarehouseWriter`-style protocol so engines (Snowflake, Databricks) and tests share one interface.
- Table names, partitioning, and schema come from the architect's data contract, not from this skill.

---

## Messaging bus adapters

- **Kafka / Confluent Kafka:** Use `confluent-kafka` with schema registry support (Avro/JSON Schema).
- **AWS EventBridge / SQS:** Use `boto3` client injected via factory; handle `ClientError` with exponential backoff.
- **Azure Service Bus:** Use `azure-servicebus` SDK with async or sync receiver; complete/abandon message explicitly.
- **GCP Pub/Sub:** Use `google-cloud-pubsub`; ack only after successful processing, and set a dead-letter topic on the subscription (infrastructure is the IaC mode's concern).

---

## Anti-patterns

- **Direct client instantiation:** Writing `client = boto3.client("s3")` inside a business function prevents unit testing and mocking.
- **Connection leakage:** Opening database connections inside message loops without context managers or pooling.
- **Unparameterized queries:** Using string formatting (`f"SELECT * FROM {user_input}"`) creates SQL injection vulnerabilities.

---

## Grounding sources

- [Snowflake Connector for Python](https://docs.snowflake.com/en/developer-guide/python-connector/python-connector) — verified: 2026-03-30
- [Databricks SQL Connector for Python](https://docs.databricks.com/en/dev-tools/python-sql-connector.html) — verified: 2026-03-30
- [Google Cloud BigQuery Python Client](https://cloud.google.com/python/docs/reference/bigquery/latest) — verified: 2026-03-30
- [Confluent Kafka Python](https://docs.confluent.io/kafka-clients/python/current/overview.html) — verified: 2026-03-30
