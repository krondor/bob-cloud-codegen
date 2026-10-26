---
name: llm-prompt-and-pipeline-patterns
version: 0.1.0
description: LLM invocation pipelines, prompt template management in prompts/, structured output extraction (Pydantic), token budgeting, exponential backoff, and PII sanitization in Python.
when_to_use: Use when generating Python code that formats prompt templates, calls LLM inference APIs, parses structured LLM outputs, or implements AI processing pipelines.
---

# LLM Prompt and Pipeline Patterns

Patterns for reliable, type-safe, and cost-effective LLM integration pipelines in Python.

## Skill navigation

| Section | Description |
|---|---|
| [Prompt template management](#prompt-template-management) | YAML and text templates in `prompts/` |
| [Structured output parsing](#structured-output-parsing) | Pydantic schema validation and JSON schema enforcement |
| [Resilience & token budgeting](#resilience--token-budgeting) | Rate limits, exponential backoff, token estimation |
| [Anti-patterns](#anti-patterns) | Common LLM integration pitfalls |
| [Grounding sources](#grounding-sources) | Reference links and verification dates |

---

## Prompt template management

Store versioned prompt templates under `prompts/<name>_prompt.yaml`:

```yaml
version: "1.0.0"
model_compatibility: ["gpt-4o", "claude-3-5-sonnet-20241022", "gemini-1.5-pro"]
temperature: 0.0
system_prompt: |
  You are an enterprise document extraction assistant. Extract structured entities in JSON.
user_template: |
  Document text:
  {{ document_text }}

  Extract all key fields matching the schema.
```

In Python code, load templates via a template manager rather than embedding strings directly in code.

---

## Structured output parsing

Use Pydantic models to validate LLM JSON completions:

```python
"""Structured LLM extraction parser."""
from __future__ import annotations
import json
import logging
from typing import Any, TypeVar
from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)

def parse_llm_json(raw_completion: str, model_cls: type[T]) -> T:
    """Safely parse and validate LLM completion into a Pydantic model."""
    try:
        # Strip potential markdown code fences if present
        cleaned = raw_completion.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        
        data = json.loads(cleaned.strip())
        return model_cls.model_validate(data)
    except (json.JSONDecodeError, ValidationError) as exc:
        logger.error("Failed to parse LLM structured output: %s (Raw: %s)", exc, raw_completion)
        raise ValueError(f"Malformed LLM response: {exc}") from exc
```

---

## Resilience & token budgeting

1. **Token estimation:** Estimate input token count using `tiktoken` or character-based heuristics (e.g. chars / 4) before dispatching to avoid token limit errors.
2. **Backoff on 429/503:** Implement exponential backoff with full jitter specifically targeting rate limits (`429 Too Many Requests`).
3. **Fallback models:** Support secondary cheaper or smaller models if primary model invocation fails.

---

## Anti-patterns

- **Hardcoded model strings in business logic:** Hardcoding specific model checkpoints makes upgrading models require code refactoring.
- **Unvalidated JSON output:** Assuming LLMs always produce valid JSON without try/except and schema validation.
- **Logging full LLM responses containing PII:** Dumping prompt and completion payloads directly into plain text application logs.

---

## Grounding sources

- [OpenAI Structured Outputs Guide](https://platform.openai.com/docs/guides/structured-outputs) — verified: 2026-03-30
- [Anthropic Tool Use and Output Parsing](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) — verified: 2026-03-30
- [Pydantic Validation Documentation](https://docs.pydantic.dev/latest/) — verified: 2026-03-30
