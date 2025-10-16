from __future__ import annotations

from textwrap import dedent
from typing import Any, Dict, List, Optional, Sequence, cast

from django.http import Http404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from ..data import (
    apply_block_conversion_suggestion,
    create_block_conversion_suggestion,
    extract_chapter_context_for_block,
    get_active_context_items,
    get_book_metadata,
    get_chapter_detail,
)
from ..data.conversions import BlockConversionError
from ..data.generation import normalize_generated_blocks
from ..payloads import (
    ChapterBlockPayload,
    ContextItemPayload,
    MetadataBlockPayload,
    ParagraphBlockPayload,
    SceneBoundaryBlockPayload,
)
from ..prompts import (
    build_paragraph_suggestion_prompt,
    build_paragraph_suggestion_prompt_base,
)
from ..serializers import (
    BlockConversionApplySerializer,
    BlockConversionRequestSerializer,
    BlockConversionResponseSerializer,
    ChapterDetailSerializer,
    GeneralSuggestionPromptResponseSerializer,
    GeneralSuggestionRequestSerializer,
    GeneralSuggestionResponseSerializer,
    ParagraphSuggestionPromptResponseSerializer,
    ParagraphSuggestionRequestSerializer,
    ParagraphSuggestionResponseSerializer,
)
from ..services.gemini import GeminiServiceError, generate_block_conversion

__all__ = [
    "ChapterParagraphSuggestionView",
    "ChapterParagraphSuggestionPromptView",
    "ChapterGeneralSuggestionView",
    "ChapterGeneralSuggestionPromptView",
    "ChapterBlockConversionSuggestionView",
    "BlockConversionApplyView",
]


DEFAULT_SUGGESTION_MODEL = "gemini-2.5-flash-preview-09-2025"
MAX_CONTEXT_ITEMS = 10


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


class ChapterGeneralSuggestionView(APIView):
    """Generate block-agnostic filler suggestions for a chapter."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(
        request=GeneralSuggestionRequestSerializer,
        responses=GeneralSuggestionResponseSerializer,
    )
    def post(self, request, chapter_id: str):
        serializer = GeneralSuggestionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        try:
            suggestion = _generate_general_suggestion(
                chapter_id=chapter_id,
                placement=payload["placement"],
                anchor_block_id=payload.get("anchorBlockId"),
                user_prompt=payload["prompt"],
                model=payload.get("model"),
            )
        except GeminiServiceError as exc:
            raise ValidationError({"detail": str(exc)}) from exc
        except KeyError as exc:
            raise Http404(str(exc)) from exc
        except ValueError as exc:
            raise ValidationError({"detail": str(exc)}) from exc

        response_serializer = GeneralSuggestionResponseSerializer(suggestion)
        return Response(response_serializer.data)


class ChapterGeneralSuggestionPromptView(APIView):
    """Return the prompt used for block-agnostic suggestions."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(
        request=GeneralSuggestionRequestSerializer,
        responses=GeneralSuggestionPromptResponseSerializer,
    )
    def post(self, request, chapter_id: str):
        serializer = GeneralSuggestionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        try:
            prompt = _build_general_suggestion_prompt(
                chapter_id=chapter_id,
                placement=payload["placement"],
                anchor_block_id=payload.get("anchorBlockId"),
                user_prompt=payload["prompt"],
                include_response_format=False,
            )
        except KeyError as exc:
            raise Http404(str(exc)) from exc
        except ValueError as exc:
            raise ValidationError({"detail": str(exc)}) from exc

        response_serializer = GeneralSuggestionPromptResponseSerializer({"prompt": prompt})
        return Response(response_serializer.data)


class ChapterBlockConversionSuggestionView(APIView):
    """Generate a block conversion suggestion using Gemini."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(
        request=BlockConversionRequestSerializer,
        responses=BlockConversionResponseSerializer,
    )
    def post(self, request, chapter_id: str):
        serializer = BlockConversionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        try:
            suggestion = create_block_conversion_suggestion(
                chapter_id=chapter_id,
                text=payload["text"],
                instructions=payload.get("instructions"),
                context_block_id=payload.get("contextBlockId"),
            )
        except KeyError as exc:
            raise Http404(str(exc)) from exc
        except (ValueError, GeminiServiceError) as exc:
            raise ValidationError({"detail": str(exc)}) from exc

        response_serializer = BlockConversionResponseSerializer(suggestion)
        return Response(response_serializer.data)


class BlockConversionApplyView(APIView):
    """Apply a stored block conversion suggestion to a chapter."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(
        request=BlockConversionApplySerializer,
        responses=ChapterDetailSerializer,
    )
    def post(self, request, conversion_id: str):
        serializer = BlockConversionApplySerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        try:
            detail = apply_block_conversion_suggestion(
                conversion_id=conversion_id,
                anchor_block_id=payload.get("anchorBlockId"),
                placement=payload.get("placement", "append"),
            )
        except KeyError as exc:
            raise Http404(str(exc)) from exc
        except (ValueError, BlockConversionError) as exc:
            raise ValidationError({"detail": str(exc)}) from exc

        response_serializer = ChapterDetailSerializer(detail)
        return Response(response_serializer.data)


def _generate_general_suggestion(
    *,
    chapter_id: str,
    placement: str,
    anchor_block_id: Optional[str],
    user_prompt: str,
    model: Optional[str],
) -> Dict[str, Any]:
    prompt = _build_general_suggestion_prompt(
        chapter_id=chapter_id,
        placement=placement,
        anchor_block_id=anchor_block_id,
        user_prompt=user_prompt,
        include_response_format=True,
    )

    response = generate_block_conversion(
        prompt=prompt,
        model=model or DEFAULT_SUGGESTION_MODEL,
    )

    raw_blocks = response.get("blocks")
    normalized_blocks = normalize_generated_blocks(raw_blocks)

    return {
        "model": response.get("model") or model or DEFAULT_SUGGESTION_MODEL,
        "blocks": normalized_blocks,
    }


def _build_general_suggestion_prompt(
    *,
    chapter_id: str,
    placement: str,
    anchor_block_id: Optional[str],
    user_prompt: str,
    include_response_format: bool,
) -> str:
    chapter = get_chapter_detail(chapter_id)
    if chapter is None:
        raise Http404("Chapter not found")

    cleaned_prompt = user_prompt.strip()
    if not cleaned_prompt:
        raise ValidationError({"prompt": "El prompt no puede estar vacío."})

    placement_key = placement.strip().lower()
    if placement_key not in {"before", "after", "append"}:
        raise ValidationError({"placement": "Ubicación no soportada."})

    blocks: List[ChapterBlockPayload] = sorted(
        chapter.get("blocks", []),
        key=lambda block: block.get("position", 0),
    )

    anchor_block: Optional[ChapterBlockPayload] = None
    if anchor_block_id:
        anchor_block = next(
            (block for block in blocks if block.get("id") == anchor_block_id),
            None,
        )
        if anchor_block is None:
            raise Http404("Block not found")

    if placement_key in {"before", "after"} and anchor_block is None:
        raise ValidationError(
            {"anchorBlockId": "Debes proporcionar un bloque válido para esta ubicación."}
        )

    if placement_key == "append" and anchor_block is None:
        anchor_block = _get_last_content_block(blocks)

    context = extract_chapter_context_for_block(
        chapter,
        anchor_block.get("id") if anchor_block else None,
    )

    preceding_blocks, following_blocks = _resolve_insertion_surroundings(
        placement=placement_key,
        anchor_block=anchor_block,
        context_window=context,
    )

    metadata_block = cast(Optional[MetadataBlockPayload], context.get("metadata_block"))
    scene_block = cast(Optional[SceneBoundaryBlockPayload], context.get("scene_block"))

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

        context_items = get_active_context_items(
            book_id=book_id,
            chapter_id=chapter.get("id"),
        )
    else:
        context_items = []

    role_section = dedent(
        """
        ### Rol
        Eres un asistente editorial que escribe en español neutro. Debes proponer un relleno narrativo
        coherente con el capítulo y sus personajes.
        """
    ).strip()

    rules_section = dedent(
        """
        ### Reglas
        - Genera entre uno y tres bloques consecutivos.
        - Usa únicamente bloques de tipo "paragraph" o "dialogue".
        - Mantén continuidad de tono, personajes y eventos.
        - Evita repetir texto exacto de los bloques existentes.
        - No añadas explicaciones ni texto fuera del formato solicitado.
        """
    ).strip()

    user_section = f"### Instrucción del usuario\n{cleaned_prompt}"

    insertion_section = _format_insertion_context_section(
        placement=placement_key,
        anchor_block=anchor_block,
        preceding_blocks=preceding_blocks,
        following_blocks=following_blocks,
    )

    book_section = _format_book_metadata_section(
        title=book_title,
        author=book_author,
        synopsis=book_synopsis,
    )

    chapter_section = _format_chapter_overview(chapter)

    narrative_section = _format_narrative_context_section(
        metadata_block=metadata_block,
        scene_block=scene_block,
    )

    context_items_section = _format_context_items_section(context_items)

    sections = [
        role_section,
        rules_section,
        user_section,
        insertion_section,
        book_section,
        chapter_section,
        narrative_section,
        context_items_section,
    ]

    if include_response_format:
        response_section = dedent(
            """
            ### Formato de respuesta
            Responde exclusivamente con JSON válido usando la siguiente forma:
            {
              "blocks": [
                {
                  "type": "paragraph",
                  "text": "..."
                },
                {
                  "type": "dialogue",
                  "context": "Contexto opcional",
                  "turns": [
                    {
                      "speakerName": "Nombre opcional",
                      "utterance": "Línea de diálogo",
                      "stageDirection": "Acotación opcional"
                    }
                  ]
                }
              ]
            }

            No incluyas texto adicional antes o después del JSON.
            """
        ).strip()
        sections.append(response_section)

    return "\n\n".join(section for section in sections if section)


def _resolve_insertion_surroundings(
    *,
    placement: str,
    anchor_block: Optional[ChapterBlockPayload],
    context_window: Dict[str, Any],
) -> tuple[List[ChapterBlockPayload], List[ChapterBlockPayload]]:
    preceding_base: List[ChapterBlockPayload] = list(context_window.get("preceding_blocks") or [])
    following_base: List[ChapterBlockPayload] = list(context_window.get("following_blocks") or [])

    if placement == "before":
        preceding = preceding_base[-3:]
        following: List[ChapterBlockPayload] = []
        if anchor_block is not None:
            following.append(anchor_block)
        following.extend(following_base[:2])
    elif placement == "after":
        preceding = [block for block in [*preceding_base, anchor_block] if block is not None][-3:]
        following = following_base[:3]
    elif placement == "append":
        preceding = [block for block in [*preceding_base, anchor_block] if block is not None][-3:]
        following = []
    else:
        raise ValueError("Ubicación no soportada.")

    return _dedupe_blocks(preceding), _dedupe_blocks(following)


def _dedupe_blocks(blocks: Sequence[ChapterBlockPayload]) -> List[ChapterBlockPayload]:
    seen: set[str] = set()
    deduped: List[ChapterBlockPayload] = []
    for block in blocks:
        block_id = block.get("id")
        if block_id and block_id in seen:
            continue
        if block_id:
            seen.add(block_id)
        deduped.append(block)
    return deduped


def _get_last_content_block(
    blocks: Sequence[ChapterBlockPayload],
) -> Optional[ChapterBlockPayload]:
    for block in reversed(blocks):
        if block.get("type") != "metadata":
            return block
    return blocks[-1] if blocks else None


def _render_block_excerpt(block: ChapterBlockPayload) -> str:
    label_map = {
        "paragraph": "Párrafo",
        "dialogue": "Diálogo",
        "scene_boundary": "Escena",
        "metadata": "Metadata",
    }
    block_type = block.get("type")
    label = label_map.get(block_type, "Bloque")

    snippet = ""
    if block_type == "paragraph":
        text = (block.get("text") or "").strip()
        style = block.get("style")
        if style and style != "narration" and text:
            snippet = f"[{style}] {text}"
        else:
            snippet = text
    elif block_type == "dialogue":
        turns = block.get("turns") or []
        fragments: List[str] = []
        for turn in turns[:2]:
            speaker = (turn.get("speakerName") or "").strip()
            utterance = (turn.get("utterance") or "").strip()
            if not utterance:
                continue
            if speaker:
                fragments.append(f"{speaker}: {utterance}")
            else:
                fragments.append(utterance)
        snippet = " | ".join(fragments)
        context = (block.get("context") or "").strip()
        if context and not snippet:
            snippet = context
    elif block_type == "scene_boundary":
        label_value = (block.get("label") or "").strip()
        summary = (block.get("summary") or "").strip()
        location = (block.get("locationName") or "").strip()
        snippet_parts = [part for part in [label_value, summary, location] if part]
        snippet = " — ".join(snippet_parts)
    elif block_type == "metadata":
        title = (block.get("title") or "").strip()
        subtitle = (block.get("subtitle") or "").strip()
        pov = (block.get("povCharacterName") or "").strip()
        timeline = (block.get("timelineMarker") or "").strip()
        location = (block.get("locationName") or "").strip()
        snippet_parts = [part for part in [title, subtitle, pov, location, timeline] if part]
        snippet = " — ".join(snippet_parts)

    if not snippet:
        snippet = "(sin contenido)"

    snippet = " ".join(snippet.split())
    if len(snippet) > 180:
        snippet = snippet[:177].rstrip() + "..."

    block_id = block.get("id")
    if block_id:
        return f"{label} [{block_id}]: {snippet}"
    return f"{label}: {snippet}"


def _format_book_metadata_section(
    *,
    title: Optional[str],
    author: Optional[str],
    synopsis: Optional[str],
) -> str:
    if not any([title, author, synopsis]):
        return ""

    lines = ["### Contexto del libro"]
    if title:
        lines.append(f"- Título: {title}")
    if author:
        lines.append(f"- Autor: {author}")
    if synopsis:
        lines.append(f"- Sinopsis: {synopsis}")
    return "\n".join(lines)


def _format_chapter_overview(chapter: Dict[str, Any]) -> str:
    lines = ["### Datos del capítulo"]
    title = chapter.get("title") or ""
    lines.append(f"- Título: {title}")
    summary = chapter.get("summary")
    if summary:
        lines.append(f"- Resumen: {summary}")
    ordinal = chapter.get("ordinal")
    if ordinal is not None:
        lines.append(f"- Número de capítulo: {ordinal}")
    total_blocks = len(chapter.get("blocks", []))
    lines.append(f"- Total de bloques: {total_blocks}")
    return "\n".join(lines)


def _format_context_items_section(
    context_items: Sequence[ContextItemPayload],
) -> str:
    if not context_items:
        return ""

    lines = ["### Elementos de contexto activos"]
    limited_items = list(context_items)[:MAX_CONTEXT_ITEMS]
    for item in limited_items:
        item_type = item.get("type") or "desconocido"
        scope = "capítulo" if item.get("chapterId") else "libro"
        name = (
            item.get("name")
            or item.get("title")
            or item.get("summary")
            or item.get("description")
            or "Elemento sin nombre"
        )
        summary = item.get("summary") or item.get("description")
        entry = f"- ({item_type}, {scope}) {name}"
        if summary:
            trimmed = " ".join(summary.split())
            if len(trimmed) > 160:
                trimmed = trimmed[:157].rstrip() + "..."
            entry += f": {trimmed}"
        lines.append(entry)

    remaining = len(context_items) - len(limited_items)
    if remaining > 0:
        lines.append(f"- ... y {remaining} elementos adicionales.")

    return "\n".join(lines)


def _format_narrative_context_section(
    *,
    metadata_block: Optional[MetadataBlockPayload],
    scene_block: Optional[SceneBoundaryBlockPayload],
) -> str:
    lines: List[str] = []

    if metadata_block:
        pov = metadata_block.get("povCharacterName")
        location = metadata_block.get("locationName")
        timeline = metadata_block.get("timelineMarker")
        theme_tags = metadata_block.get("themeTags") or []

        if any([pov, location, timeline, theme_tags]):
            lines.append("### Contexto narrativo")
            if pov:
                lines.append(f"- Punto de vista: {pov}")
            if location:
                lines.append(f"- Ubicación: {location}")
            if timeline:
                lines.append(f"- Línea temporal: {timeline}")
            if theme_tags:
                lines.append(f"- Temas: {', '.join(theme_tags)}")

    if scene_block:
        section_lines = ["### Escena activa"]
        label_value = scene_block.get("label") or scene_block.get("summary")
        if label_value:
            section_lines.append(f"- Escena: {label_value}")
        mood = scene_block.get("mood")
        if mood:
            section_lines.append(f"- Atmósfera: {mood}")
        location = scene_block.get("locationName")
        if location:
            section_lines.append(f"- Ubicación: {location}")
        timestamp = scene_block.get("timestamp")
        if timestamp:
            section_lines.append(f"- Momento: {timestamp}")

        if lines:
            lines.append("")
        lines.extend(section_lines)

    return "\n".join(lines).strip()


def _format_insertion_context_section(
    *,
    placement: str,
    anchor_block: Optional[ChapterBlockPayload],
    preceding_blocks: Sequence[ChapterBlockPayload],
    following_blocks: Sequence[ChapterBlockPayload],
) -> str:
    lines = ["### Ubicación del relleno"]
    if placement == "before":
        lines.append("Inserta el contenido antes del bloque objetivo.")
    elif placement == "after":
        lines.append("Inserta el contenido inmediatamente después del bloque objetivo.")
    elif placement == "append":
        lines.append("Inserta el contenido al final del capítulo.")
    else:
        lines.append("Ubicación no especificada.")

    if anchor_block:
        lines.append(f"- Bloque objetivo: {_render_block_excerpt(anchor_block)}")
    elif placement == "append":
        lines.append("- El capítulo está vacío; este será el primer contenido.")

    lines.append("")
    lines.append("### Contexto inmediato")

    if preceding_blocks:
        lines.append("- Bloques previos relevantes:")
        for block in preceding_blocks:
            lines.append(f"  • {_render_block_excerpt(block)}")
    else:
        lines.append("- Bloques previos relevantes: (sin contenido)")

    if following_blocks:
        lines.append("- Bloques posteriores relevantes:")
        for block in following_blocks:
            lines.append(f"  • {_render_block_excerpt(block)}")
    else:
        lines.append("- Bloques posteriores relevantes: (sin contenido)")

    return "\n".join(lines)


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
