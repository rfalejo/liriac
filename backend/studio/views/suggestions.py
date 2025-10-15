from __future__ import annotations

from typing import cast

from django.http import Http404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from ..data import (
    extract_chapter_context_for_block,
    get_active_context_items,
    get_book_metadata,
    get_chapter_detail,
)
from ..payloads import ParagraphBlockPayload
from ..prompts import (
    build_paragraph_suggestion_prompt,
    build_paragraph_suggestion_prompt_base,
)
from ..serializers import (
    ParagraphSuggestionPromptResponseSerializer,
    ParagraphSuggestionRequestSerializer,
    ParagraphSuggestionResponseSerializer,
)
from ..services.gemini import GeminiServiceError

__all__ = [
    "ChapterParagraphSuggestionView",
    "ChapterParagraphSuggestionPromptView",
]


class ChapterParagraphSuggestionView(APIView):
    """Return an AI-generated suggestion for a chapter paragraph."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(
        request=ParagraphSuggestionRequestSerializer,
        responses=ParagraphSuggestionResponseSerializer,
    )
    def post(self, request, chapter_id: str):
        serializer = ParagraphSuggestionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        prompt = _build_paragraph_prompt(
            chapter_id=chapter_id,
            block_id=payload.get("blockId"),
            instructions=payload.get("instructions"),
            include_response_format=True,
        )

        try:
            suggestion = _generate_paragraph_suggestion(prompt)
        except GeminiServiceError as exc:
            raise ValidationError({"detail": str(exc)}) from exc

        response_serializer = ParagraphSuggestionResponseSerializer(
            {"paragraphSuggestion": suggestion}
        )
        return Response(response_serializer.data)


class ChapterParagraphSuggestionPromptView(APIView):
    """Return the raw prompt used for paragraph suggestions."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(
        request=None,
        parameters=[
            OpenApiParameter(
                name="blockId",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Identificador del bloque de párrafo para contextualizar el prompt.",
            ),
            OpenApiParameter(
                name="instructions",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Instrucciones personalizadas que se incluirán en el prompt.",
            ),
        ],
        responses=ParagraphSuggestionPromptResponseSerializer,
    )
    def get(self, request, chapter_id: str):
        serializer = ParagraphSuggestionRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        prompt = _build_paragraph_prompt(
            chapter_id=chapter_id,
            block_id=payload.get("blockId"),
            instructions=payload.get("instructions"),
            include_response_format=False,
        )

        response_serializer = ParagraphSuggestionPromptResponseSerializer({"prompt": prompt})
        return Response(response_serializer.data)


def _generate_paragraph_suggestion(prompt: str) -> str:
    from . import generate_paragraph_suggestion

    return generate_paragraph_suggestion(prompt=prompt)


def _build_paragraph_prompt(
    *,
    chapter_id: str,
    block_id: str | None,
    instructions: str | None,
    include_response_format: bool,
) -> str:
    chapter = get_chapter_detail(chapter_id)
    if chapter is None:
        raise Http404("Chapter not found")

    block_payload = None
    if block_id:
        try:
            block_payload = next(
                block for block in chapter["blocks"] if block.get("id") == block_id
            )
        except StopIteration as exc:
            raise Http404("Block not found") from exc

        if block_payload.get("type") != "paragraph":
            raise ValidationError(
                {"blockId": "Solo se pueden generar sugerencias para bloques de tipo 'paragraph'."}
            )

    paragraph_block = cast(ParagraphBlockPayload, block_payload) if block_payload else None

    book_title = chapter.get("bookTitle")
    book_author = None
    book_synopsis = None

    book_id = chapter.get("bookId")
    if book_id:
        metadata = get_book_metadata(book_id)
        if metadata:
            book_title = metadata.get("title") or book_title
            book_author = metadata.get("author")
            book_synopsis = metadata.get("synopsis")

    if book_id:
        context_items = get_active_context_items(
            book_id=book_id,
            chapter_id=chapter.get("id"),
        )
    else:
        context_items = []

    context = extract_chapter_context_for_block(chapter, block_id)

    prompt_builder = (
        build_paragraph_suggestion_prompt
        if include_response_format
        else build_paragraph_suggestion_prompt_base
    )

    return prompt_builder(
        chapter=chapter,
        book_title=book_title,
        book_author=book_author,
        book_synopsis=book_synopsis,
        block=paragraph_block,
        user_instructions=instructions,
        context_items=context_items,
        metadata_block=context.get("metadata_block"),
        scene_block=context.get("scene_block"),
        preceding_blocks=context.get("preceding_blocks"),
        following_blocks=context.get("following_blocks"),
    )
