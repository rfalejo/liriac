"""Prompt builders used to interact with AI providers."""

from .paragraph_suggestion import (
	build_paragraph_suggestion_prompt,
	build_paragraph_suggestion_prompt_base,
)

__all__ = [
	"build_paragraph_suggestion_prompt",
	"build_paragraph_suggestion_prompt_base",
]
