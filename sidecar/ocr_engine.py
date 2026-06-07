"""Tesseract OCR engine for DocuScan image processing.

Accepts base64-encoded image data, decodes it, applies preprocessing
to improve OCR accuracy on low-quality scans, and returns the extracted
text as a clean string.
"""

import base64
import io
import logging
from typing import Optional

import pytesseract
from PIL import Image, ImageFilter, ImageOps

logger = logging.getLogger("docuscan.ocr")


def run_ocr(image_b64: str) -> str:
    """Run Tesseract OCR on a base64-encoded image.

    Args:
        image_b64: Base64-encoded image bytes (PNG, JPG, TIFF, or BMP).

    Returns:
        Extracted text as a clean, trimmed string.

    Raises:
        ValueError: If the image cannot be decoded or OCR fails.
    """
    image = _decode_image(image_b64)
    processed = _preprocess(image)
    text = _run_tesseract(processed)
    cleaned = _clean_text(text)
    logger.info("OCR extracted %d characters from image", len(cleaned))
    return cleaned


def _decode_image(image_b64: str) -> Image.Image:
    try:
        raw_bytes = base64.b64decode(image_b64)
        return Image.open(io.BytesIO(raw_bytes))
    except Exception as exc:
        raise ValueError(f"Failed to decode image data: {exc}") from exc


def _preprocess(image: Image.Image) -> Image.Image:
    if image.mode in ("RGBA", "P", "LA"):
        background = Image.new("RGB", image.size, (255, 255, 255))
        if image.mode in ("RGBA", "LA"):
            background.paste(image, mask=image.split()[-1])
        else:
            background.paste(image.convert("RGB"))
        image = background

    gray = ImageOps.grayscale(image)

    width, height = gray.size
    if width < 1200 or height < 1200:
        scale = max(1200 / width, 1200 / height)
        new_size = (int(width * scale), int(height * scale))
        gray = gray.resize(new_size, Image.LANCZOS)
        logger.debug("Upscaled image to %s for OCR", new_size)

    sharpened = gray.filter(ImageFilter.SHARPEN)

    threshold = _otsu_threshold(sharpened)
    binary = sharpened.point(lambda p: 255 if p > threshold else 0)

    return binary


def _otsu_threshold(image: Image.Image) -> int:
    histogram = image.histogram()
    total_pixels = sum(histogram)
    if total_pixels == 0:
        return 128

    cumulative_sum = 0
    cumulative_weight = 0
    total_mean = sum(i * histogram[i] for i in range(256)) / total_pixels

    best_threshold = 0
    best_variance = 0.0

    for threshold in range(256):
        cumulative_weight += histogram[threshold]
        if cumulative_weight == 0:
            continue

        background_weight = cumulative_weight / total_pixels
        foreground_weight = 1.0 - background_weight
        if foreground_weight == 0:
            break

        cumulative_sum += threshold * histogram[threshold]
        background_mean = cumulative_sum / cumulative_weight
        foreground_mean = (total_mean - cumulative_sum / total_pixels) / foreground_weight

        between_class_variance = (
            background_weight * foreground_weight * (background_mean - foreground_mean) ** 2
        )

        if between_class_variance > best_variance:
            best_variance = between_class_variance
            best_threshold = threshold

    return best_threshold


def _run_tesseract(image: Image.Image) -> str:
    config = "--oem 3 --psm 6 -l eng"
    try:
        return pytesseract.image_to_string(image, config=config)
    except pytesseract.TesseractNotFoundError:
        raise ValueError(
            "Tesseract OCR is not installed. "
            "Install it with: sudo apt install tesseract-ocr (Linux) "
            "or from https://github.com/UB-Mannheim/tesseract/wiki (Windows)"
        ) from None
    except Exception as exc:
        raise ValueError(f"OCR processing failed: {exc}") from exc


def _clean_text(text: str) -> str:
    lines = [line.strip() for line in text.splitlines()]
    non_empty = [line for line in lines if line]
    return "\n".join(non_empty)
