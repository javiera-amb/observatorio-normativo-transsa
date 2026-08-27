"""Integración local con Ollama para análisis preliminar."""

from .analyzer import analyze_document
from .client import OllamaClient, OllamaError
from .config import OllamaConfig, load_ollama_config

__all__ = [
    "OllamaClient",
    "OllamaError",
    "OllamaConfig",
    "load_ollama_config",
    "analyze_document",
]
