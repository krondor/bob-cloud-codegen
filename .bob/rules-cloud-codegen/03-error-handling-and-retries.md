# Error Handling, Retries, and DLQ Standards

Universal error taxonomy and reliability conventions for event-driven Python code.

## 1. Exception taxonomy

Define `DomainError` once (conventionally `src/<package>/errors.py`) with three subclasses, and derive all
domain exceptions from them. Skills import these as `PermanentError` and `TransientError`.

- **`PermanentError`** (e.g., `SchemaValidationError`, `InvalidPayloadError`): Fatal for the single message. Do not retry; route directly to the Dead Letter Queue (DLQ) with error metadata.
- **`TransientError`** (e.g., `RateLimitExceededError`, `ConnectionTimeoutError`, `ServiceUnavailableError`): Retryable with exponential backoff and full jitter.
- **`FatalError`** (e.g., `ConfigurationError`, `AuthenticationError`): Stop execution or bubble up to the runtime container; do not consume or acknowledge the message without alerting.

Wrap SDK exceptions at the adapter boundary into one of these; never let a raw SDK exception cross it.

## 2. Retry policies

- Maximum retry count: default 3 attempts for transient exceptions.
- Backoff formula: `delay = min(max_delay, base_delay * 2 ** attempt) + random_jitter`.
- Never retry permanent schema validation or business logic rejections.

## 3. Dead letter queue (DLQ) envelope

When publishing rejected or exhausted messages to a DLQ, wrap the original payload in a standard envelope:

```python
dlq_payload = {
    "original_payload": message_body,
    "error_type": type(exc).__name__,
    "error_message": str(exc),
    "timestamp_utc": datetime.now(timezone.utc).isoformat(),
    "correlation_id": correlation_id,
    "retry_count": retry_count,
    "source_component": component_name,
}
```
