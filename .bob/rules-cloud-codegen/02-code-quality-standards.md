# Code Quality Standards

Universal Python code quality gates apply to all generated source code under `src/`.

## 1. Type annotations

- Every function signature must have complete type hints for all arguments and return values.
- Use standard library `typing` or built-in generics (`list[str]`, `dict[str, Any]`, `Optional[T]`).
- Define Pydantic models or `dataclass` for complex structured payloads and event bodies.
- Code must pass `mypy --strict` without errors.

## 2. Docstrings and documentation

- Module-level docstrings stating purpose, inputs, outputs, and side effects.
- Google-style docstrings on all public classes, methods, and functions with `Args:`, `Returns:`, and `Raises:`.
- No empty or placeholder docstrings.

## 3. Dependency injection and mockability

- Never instantiate concrete external clients (SDK clients, HTTP sessions, database connections) inside business logic functions.
- Pass clients via constructor arguments or function parameters with optional default factories.
- All adapters must expose clean abstract or protocol interfaces to enable 100% mockability without network calls.

## 4. Structured logging and correlation

- Use structured JSON logging for all log emissions.
- Standard correlation fields must be propagated through every function: `correlation_id`, `batch_id`, and `record_id` (where available).
- Never use `print()` statements for operational logging.
- Never log sensitive data, secrets, tokens, or raw PII.

## 5. Security hygiene

- No hardcoded secrets, API keys, credentials, connection strings, or account numbers.
- Fetch all sensitive configuration via environment variables or secret manager adapters.
- Validate and sanitize external inputs at system boundaries before processing.
