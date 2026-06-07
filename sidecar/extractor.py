"""LangChain-powered structured field extraction for DocuScan.

Builds a dynamic Pydantic schema from the requested fields list,
runs structured output extraction via the selected LLM, and returns
per-field confidence scores derived from response quality heuristics.
"""

import json
import logging
import re
from typing import Any, Optional

from pydantic import BaseModel, Field, create_model
from providers import get_llm

logger = logging.getLogger("docuscan.extractor")

TEMPLATES: dict[str, list[str]] = {
    "invoice": [
        "vendor_name",
        "invoice_number",
        "date",
        "due_date",
        "line_items",
        "subtotal",
        "tax",
        "total",
        "currency",
    ],
    "resume": [
        "full_name",
        "email",
        "phone",
        "location",
        "skills",
        "experience",
        "education",
        "certifications",
    ],
    "contract": [
        "parties",
        "effective_date",
        "expiry_date",
        "key_terms",
        "payment_terms",
        "jurisdiction",
    ],
    "receipt": ["merchant", "date", "items", "total", "payment_method"],
    "custom": [],
}


def extract_fields(
    text: str,
    fields: list[str],
    template: str,
    provider: str,
    api_key: Optional[str] = None,
) -> dict[str, Any]:
    """Extract structured fields from document text.

    Args:
        text: Cleaned document text to extract from.
        fields: Explicit field names to extract (overrides template defaults).
        template: Template key used to select default fields if fields is empty.
        provider: LLM provider key ('openai', 'gemini', 'huggingface').
        api_key: Optional provider key (never logged).

    Returns:
        SidecarResponse-shaped dict with success, fields, and optional error.
    """
    target_fields = fields if fields else TEMPLATES.get(template, [])

    if not target_fields:
        return {
            "success": False,
            "fields": [],
            "error": "No fields specified and template has no defaults",
        }

    llm = get_llm(provider, api_key)

    schema_fields: dict[str, Any] = {
        _to_field_name(f): (str, Field(default="", description=f"Extract: {f}"))
        for f in target_fields
    }
    ExtractionModel = create_model("ExtractionResult", **schema_fields)

    prompt = _build_prompt(text, target_fields)

    try:
        raw_response = _invoke_llm(llm, prompt)
        extracted = _parse_response(raw_response, target_fields, ExtractionModel)
    except Exception as exc:  # noqa: BLE001
        logger.exception("LLM extraction failed: %s", exc)
        return {"success": False, "fields": [], "error": str(exc)}

    result_fields = [
        {
            "name": field_name,
            "value": str(value),
            "confidence": _score_confidence(str(value), field_name, text),
        }
        for field_name, value in extracted.items()
    ]

    logger.info("Extracted %d fields successfully", len(result_fields))
    return {"success": True, "fields": result_fields, "error": None}


def _build_prompt(text: str, fields: list[str]) -> str:
    fields_list = "\n".join(f"- {f}" for f in fields)
    # Cap text at 6000 chars to stay within token limits for smaller models
    truncated = text[:6000] + ("..." if len(text) > 6000 else "")
    return f"""You are a precise document data extraction assistant.

Extract the following fields from the document text below.
Return ONLY a JSON object with the exact field names as keys and extracted values as strings.
If a field is not found, use an empty string "".
Do not add any explanation or text outside the JSON object.

Fields to extract:
{fields_list}

Document text:
---
{truncated}
---

JSON output:"""


def _invoke_llm(llm: Any, prompt: str) -> str:
    from langchain_core.messages import HumanMessage

    if hasattr(llm, "invoke"):
        try:
            response = llm.invoke([HumanMessage(content=prompt)])
            if hasattr(response, "content"):
                return str(response.content)
            return str(response)
        except Exception:
            response = llm.invoke(prompt)
            return str(response)
    return str(llm(prompt))


def _parse_response(
    raw: str,
    fields: list[str],
    model_class: type[BaseModel],  # noqa: ARG001
) -> dict[str, str]:
    json_match = re.search(r"\{[^{}]*\}", raw, re.DOTALL)
    if json_match:
        try:
            parsed = json.loads(json_match.group())
            return {f: str(parsed.get(f, parsed.get(_to_field_name(f), ""))) for f in fields}
        except json.JSONDecodeError:
            pass

    result: dict[str, str] = {}
    for field in fields:
        pattern = rf'["\']?{re.escape(field)}["\']?\s*[=:]\s*["\']?([^"\',\n\r}}]+)["\']?'
        match = re.search(pattern, raw, re.IGNORECASE)
        result[field] = match.group(1).strip() if match else ""

    return result


def _score_confidence(value: str, field_name: str, source_text: str) -> float:
    if not value or value.strip() == "":
        return 0.0

    base = 0.6

    if value.lower() in source_text.lower():
        base = min(base + 0.25, 1.0)

    date_fields = {"date", "due_date", "effective_date", "expiry_date"}
    if any(d in field_name.lower() for d in date_fields):
        if re.search(r"\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}", value):
            base = min(base + 0.1, 1.0)

    email_fields = {"email"}
    if any(e in field_name.lower() for e in email_fields):
        if re.match(r"[^@]+@[^@]+\.[^@]+", value):
            base = min(base + 0.15, 1.0)

    currency_fields = {"total", "subtotal", "tax", "amount"}
    if any(c in field_name.lower() for c in currency_fields):
        if re.search(r"[\$€£¥]?\s?\d+[\.,]\d{2}", value):
            base = min(base + 0.1, 1.0)

    return round(min(base, 1.0), 2)


def _to_field_name(raw: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_]", "_", raw).strip("_")
