from __future__ import annotations

from typing import cast

from django.http import Http404
from drf_spectacular.utils import extend_schema
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
from ..prompts import build_paragraph_suggestion_prompt
from ..serializers import (
    ParagraphSuggestionRequestSerializer,
    ParagraphSuggestionResponseSerializer,
)
from ..services.gemini import GeminiServiceError

__all__ = ["ChapterParagraphSuggestionView"]


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

        chapter = get_chapter_detail(chapter_id)
        if chapter is None:
            raise Http404("Chapter not found")

        block_payload = None
        block_id = payload.get("blockId")
        if block_id:
            try:
                block_payload = next(
                    block for block in chapter["blocks"] if block.get("id") == block_id
                )
            except StopIteration as exc:
                raise Http404("Block not found") from exc

            if block_payload.get("type") != "paragraph":
                raise ValidationError(
                    {
                        "blockId": "Solo se pueden generar sugerencias para bloques de tipo 'paragraph'."
                    }
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

        prompt = build_paragraph_suggestion_prompt(
            chapter=chapter,
            book_title=book_title,
            book_author=book_author,
            book_synopsis=book_synopsis,
            block=paragraph_block,
            user_instructions=payload.get("instructions"),
            context_items=context_items,
            metadata_block=context.get("metadata_block"),
            scene_block=context.get("scene_block"),
            preceding_blocks=context.get("preceding_blocks"),
            following_blocks=context.get("following_blocks"),
        )

        try:
            suggestion = _generate_paragraph_suggestion(prompt)
        except GeminiServiceError as exc:
            raise ValidationError({"detail": str(exc)}) from exc

        response_serializer = ParagraphSuggestionResponseSerializer(
            {"paragraphSuggestion": suggestion}
        )
        return Response(response_serializer.data)


def _generate_paragraph_suggestion(prompt: str) -> str:
    from . import generate_paragraph_suggestion

    return generate_paragraph_suggestion(prompt=prompt)
