"""Entry point for the DocuScan extraction sidecar.

Reads a JSON payload from stdin, dispatches to the appropriate extractor,
and writes a JSON response to stdout before exiting. This process model
keeps the sidecar stateless and prevents memory leaks across long sessions.
"""

import json
import logging
import sys
from typing import Any

from extractor import extract_fields
from ocr_engine import run_ocr

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stderr,
)
logger = logging.getLogger("docuscan.sidecar")


def main() -> None:
    """Read payload from stdin, process, write result to stdout."""
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            _write_error("Empty payload received")
            return

        payload: dict[str, Any] = json.loads(raw)
    except json.JSONDecodeError as exc:
        _write_error(f"Invalid JSON payload: {exc}")
        return

    logger.info(
        "Received payload — template=%s provider=%s content_type=%s fields=%s",
        payload.get("template"),
        payload.get("provider"),
        payload.get("content_type"),
        payload.get("fields"),
    )

    try:
        content_type = payload.get("content_type", "text")
        content = payload.get("content", "")

        if content_type == "image":
            logger.info("Running OCR on image content")
            text = run_ocr(content)
        else:
            text = content

        if not text or not text.strip():
            _write_error("No text content available for extraction")
            return

        result = extract_fields(
            text=text,
            fields=payload.get("fields", []),
            template=payload.get("template", "custom"),
            provider=payload.get("provider", "huggingface"),
            api_key=payload.get("api_key"),
        )

        print(json.dumps(result), flush=True)

    except Exception as exc:  # noqa: BLE001
        logger.exception("Extraction failed: %s", exc)
        _write_error(str(exc))


def _write_error(message: str) -> None:
    """Write a standardized error response to stdout."""
    response = {"success": False, "fields": [], "error": message}
    print(json.dumps(response), flush=True)


if __name__ == "__main__":
    main()
