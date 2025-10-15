"""Service clients that integrate with external providers."""

from .gemini import generate_block_conversion, generate_paragraph_suggestion

__all__ = ["generate_paragraph_suggestion", "generate_block_conversion"]
