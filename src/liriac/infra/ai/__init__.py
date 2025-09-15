"""AI provider adapters.

Exports default OpenAIProvider implementation.
"""

from .openai.client import OpenAIProvider

__all__ = ["OpenAIProvider"]
