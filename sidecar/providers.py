"""LLM provider factory for DocuScan extraction.

Supports OpenAI (gpt-4o-mini), Google Gemini (gemini-1.5-flash), and
HuggingFace (Mistral-7B-Instruct) as drop-in backends for LangChain.
API keys are accepted at call time and never logged or persisted.
"""

import logging
import os
from typing import Optional

from langchain_core.language_models import BaseLanguageModel

logger = logging.getLogger("docuscan.providers")


def get_llm(provider: str, api_key: Optional[str] = None) -> BaseLanguageModel:
    """Return an LLM instance for the given provider.

    Args:
        provider: One of 'openai', 'gemini', 'huggingface'.
        api_key: Provider API key. Required for openai and gemini.

    Returns:
        Configured LangChain LLM instance.

    Raises:
        ValueError: If provider is unknown or required key is missing.
    """
    if provider == "openai":
        return _build_openai(api_key)
    elif provider == "gemini":
        return _build_gemini(api_key)
    elif provider == "huggingface":
        return _build_huggingface(api_key)
    else:
        raise ValueError(f"Unknown LLM provider: '{provider}'")


def _build_openai(api_key: Optional[str]) -> BaseLanguageModel:
    from langchain_openai import ChatOpenAI

    key = api_key or os.getenv("OPENAI_API_KEY")
    if not key:
        raise ValueError("OpenAI API key is required — enter it in the settings panel")

    logger.info("Initializing OpenAI provider (gpt-4o-mini)")
    return ChatOpenAI(
        model="gpt-4o-mini",
        api_key=key,  # type: ignore[arg-type]
        temperature=0,
        max_retries=2,
    )


def _build_gemini(api_key: Optional[str]) -> BaseLanguageModel:
    from langchain_google_genai import ChatGoogleGenerativeAI

    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        raise ValueError("Gemini API key is required — enter it in the settings panel")

    logger.info("Initializing Gemini provider (gemini-1.5-flash)")
    return ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=key,  # type: ignore[arg-type]
        temperature=0,
    )


def _build_huggingface(api_key: Optional[str]) -> BaseLanguageModel:
    from langchain_community.llms import HuggingFaceHub

    key = api_key or os.getenv("HF_API_TOKEN")

    logger.info("Initializing HuggingFace provider (Mistral-7B-Instruct-v0.2)")
    return HuggingFaceHub(
        repo_id="mistralai/Mistral-7B-Instruct-v0.2",
        huggingfacehub_api_token=key,  # type: ignore[arg-type]
        model_kwargs={
            "temperature": 0.1,
            "max_new_tokens": 1024,
            "return_full_text": False,
        },
    )
