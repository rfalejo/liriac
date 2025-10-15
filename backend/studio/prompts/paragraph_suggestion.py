from __future__ import annotations

from textwrap import dedent
from typing import List, Optional

from ..payloads import (
    ChapterBlockPayload,
    ChapterDetailPayload,
    ContextItemPayload,
    MetadataBlockPayload,
    ParagraphBlockPayload,
    SceneBoundaryBlockPayload,
)

HIGHLIGHT_BORDER = "=========="
HIGHLIGHT_PLACEHOLDER = "Nuevo párrafo irá aquí"
HIGHLIGHT_PREFIX = "||  "
HIGHLIGHT_SUFFIX = " ||"


def _build_highlight_lines(text: Optional[str]) -> List[str]:
    if text and text.strip():
        content_lines = text.splitlines()
    else:
        content_lines = [HIGHLIGHT_PLACEHOLDER]
    rendered: List[str] = []
    for line in content_lines:
        padded = line if line else ""
        rendered.append(f"{HIGHLIGHT_PREFIX}{padded}{HIGHLIGHT_SUFFIX}")
    return rendered


def _render_block_text(block: ChapterBlockPayload) -> str:
    block_type = block.get("type")

    if block_type == "paragraph":
        text = (block.get("text") or "").strip()
        if not text:
            return ""
        style = block.get("style")
        prefix = f"[{style}] " if style and style != "narration" else ""
        return prefix + text

    if block_type == "dialogue":
        turns = block.get("turns") or []
        if not turns:
            return ""
        lines: List[str] = []
        for turn in turns:
            speaker = (turn.get("speakerName") or "").strip()
            utterance = (turn.get("utterance") or "").strip()
            if speaker and utterance:
                lines.append(f"{speaker}: {utterance}")
            elif utterance:
                lines.append(utterance)
        if not lines:
            return ""
        return "\n".join(["[diálogo]", *lines])

    if block_type == "scene_boundary":
        label = (block.get("label") or "").strip()
        summary = (block.get("summary") or "").strip()
        mood = (block.get("mood") or "").strip()
        location = (block.get("locationName") or "").strip()
        timestamp = (block.get("timestamp") or "").strip()
        descriptor = label or summary or mood or location or timestamp
        if not descriptor:
            return ""
        lines = [f"[escena] {descriptor}"]
        extra_parts: List[str] = []
        if location and location != descriptor:
            extra_parts.append(f"Ubicación: {location}")
        if timestamp and timestamp != descriptor:
            extra_parts.append(f"Momento: {timestamp}")
        lines.extend(extra_parts)
        return "\n".join(lines)

    if block_type == "metadata":
        kind = (block.get("kind") or "metadata").strip()
        title = (block.get("title") or "").strip()
        subtitle = (block.get("subtitle") or "").strip()
        details = " - ".join([part for part in [title, subtitle] if part])
        if not details:
            return ""
        return f"[{kind}] {details}".strip()

    return ""


def _format_book_section(
    *, title: Optional[str], author: Optional[str], synopsis: Optional[str]
) -> str:
    lines = ["### Contexto del libro"]
    if title:
        lines.append(f"- Título: {title}")
    if author:
        lines.append(f"- Autor: {author}")
    if synopsis:
        lines.append(f"- Sinopsis: {synopsis}")
    return "\n".join(lines)


def _format_chapter_section(
    chapter: ChapterDetailPayload,
    *,
    target_block_id: Optional[str],
) -> str:
    lines = ["### Contexto del capítulo"]
    lines.append(f"- Título: {chapter.get('title', '')}")
    summary = chapter.get("summary")
    if summary:
        lines.append(f"- Resumen: {summary}")
    ordinal = chapter.get("ordinal")
    if ordinal is not None:
        lines.append(f"- Número de capítulo: {ordinal}")

    block_lines: List[str] = []
    chapter_blocks = sorted(chapter.get("blocks", []), key=lambda b: b.get("position", 0))
    highlight_inserted = False
    has_renderable = False

    if chapter_blocks:
        for block in chapter_blocks:
            is_target = bool(target_block_id) and block.get("id") == target_block_id

            if is_target:
                style = block.get("style") if block.get("type") == "paragraph" else None
                paragraph_text = (block.get("text") or "").strip()
                if style and style != "narration" and paragraph_text:
                    highlight_content = f"[{style}] {paragraph_text}"
                elif style and style != "narration":
                    highlight_content = f"[{style}]"
                elif paragraph_text:
                    highlight_content = paragraph_text
                else:
                    highlight_content = None

                if block_lines:
                    block_lines.append("")
                block_lines.append(HIGHLIGHT_BORDER)
                highlight_lines = _build_highlight_lines(highlight_content)
                block_lines.extend(highlight_lines)
                block_lines.append(HIGHLIGHT_BORDER)
                highlight_inserted = True
                has_renderable = has_renderable or any(line.strip() for line in highlight_lines)
            else:
                rendered = _render_block_text(block)
                if rendered:
                    if block_lines:
                        block_lines.append("")
                    rendered_lines = rendered.splitlines()
                    block_lines.extend(rendered_lines)
                    has_renderable = True
    else:
        block_lines.append(HIGHLIGHT_BORDER)
        highlight_lines = _build_highlight_lines(None)
        block_lines.extend(highlight_lines)
        block_lines.append(HIGHLIGHT_BORDER)
        highlight_inserted = True
        has_renderable = True

    if not highlight_inserted:
        if block_lines:
            block_lines.append("")
        block_lines.append(HIGHLIGHT_BORDER)
        highlight_lines = _build_highlight_lines(None)
        block_lines.extend(highlight_lines)
        block_lines.append(HIGHLIGHT_BORDER)
        has_renderable = has_renderable or any(line.strip() for line in highlight_lines)

    if not has_renderable:
        block_lines.append("(sin contenido)")

    lines.append("")
    lines.append("### Contenido completo del capítulo")
    lines.append("```markdown")
    lines.extend(block_lines)
    lines.append("```")
    return "\n".join(lines)


def _render_context_groups(
    items: List[ContextItemPayload],
    *,
    indent: str,
) -> List[str]:
    characters = [item for item in items if item.get("type") == "character"]
    world_items = [item for item in items if item.get("type") == "world"]
    style_items = [item for item in items if item.get("type") == "styleTone"]

    lines: List[str] = []

    if characters:
        lines.append(f"{indent}- Personajes clave:")
        for char in characters:
            name = char.get("name", "")
            role = char.get("role")
            summary = char.get("summary")
            entry = f"{indent}  • {name}" if name else f"{indent}  • Personaje"
            if role:
                entry += f" ({role})"
            if summary:
                entry += f": {summary}"
            lines.append(entry)

    if world_items:
        lines.append(f"{indent}- Detalles del mundo:")
        for item in world_items:
            name = item.get("name") or item.get("title", "")
            description = item.get("description") or item.get("summary")
            entry = f"{indent}  • {name}" if name else f"{indent}  • Escenario"
            if description:
                entry += f": {description}"
            lines.append(entry)

    if style_items:
        lines.append(f"{indent}- Notas de estilo y tono:")
        for item in style_items:
            name = item.get("name") or "Estilo"
            description = item.get("description")
            entry = f"{indent}  • {name}"
            if description:
                entry += f": {description}"
            lines.append(entry)

    return lines


def _format_context_items_section(context_items: List[ContextItemPayload]) -> str:
    """Format active library context items grouped by scope."""
    if not context_items:
        return ""

    book_items = [item for item in context_items if not item.get("chapterId")]
    chapter_items = [item for item in context_items if item.get("chapterId")]

    lines: List[str] = ["### Contexto seleccionado"]
    total = len(context_items)
    lines.append(f"- Total de elementos activos: {total}")

    if book_items:
        lines.append("- Elementos del libro:")
        lines.extend(_render_context_groups(book_items, indent="  "))

    if chapter_items:
        lines.append("- Elementos del capítulo:")
        lines.extend(_render_context_groups(chapter_items, indent="  "))

    return "\n".join([line for line in lines if line])


def _format_scene_context_section(
    *,
    metadata_block: Optional[MetadataBlockPayload],
    scene_block: Optional[SceneBoundaryBlockPayload],
) -> str:
    """Format current scene and metadata context (POV, location, timeline, mood)."""
    lines = []

    # Extract from metadata block
    if metadata_block:
        pov_name = metadata_block.get("povCharacterName")
        location_name = metadata_block.get("locationName")
        timeline = metadata_block.get("timelineMarker")
        theme_tags = metadata_block.get("themeTags", [])

        if pov_name or location_name or timeline or theme_tags:
            lines.append("### Contexto narrativo")

            if pov_name:
                lines.append(f"- Punto de vista: {pov_name}")
            if location_name:
                lines.append(f"- Ubicación: {location_name}")
            if timeline:
                lines.append(f"- Línea temporal: {timeline}")
            if theme_tags:
                lines.append(f"- Temas: {', '.join(theme_tags)}")

    # Extract from scene boundary
    if scene_block:
        label = scene_block.get("label")
        summary = scene_block.get("summary")
        mood = scene_block.get("mood")
        location = scene_block.get("locationName")
        timestamp = scene_block.get("timestamp")

        if label or summary or mood or location or timestamp:
            if lines:
                lines.append("")  # Add spacing
            lines.append("### Escena actual")

            if label:
                lines.append(f"- Etiqueta: {label}")
            if summary:
                lines.append(f"- Resumen: {summary}")
            if mood:
                lines.append(f"- Atmósfera: {mood}")
            if location and not (metadata_block and metadata_block.get("locationName")):
                lines.append(f"- Ubicación: {location}")
            if timestamp:
                lines.append(f"- Momento: {timestamp}")

    return "\n".join(lines) if lines else ""


def _format_block_section(block: Optional[ParagraphBlockPayload]) -> str:
    """Format the target paragraph block with its style information."""
    if block is None:
        return "### Bloque objetivo\nBloque objetivo: (sin contenido)"

    text = block.get("text") if block else None
    style = block.get("style")
    tags = block.get("tags", [])

    lines = ["### Bloque objetivo"]
    lines.append("```markdown")

    if style and style != "narration":
        lines.append(f"- Estilo: {style}")

    if tags:
        lines.append(f"- Etiquetas: {', '.join(tags)}")

    if text:
        lines.append(f"- Texto: \n{text}")
    else:
        lines.append("- Texto: \n(Sin contenido; genera un nuevo párrafo en la ubicación indicada)")

    lines.append("```")

    return "\n".join(lines)


def _build_paragraph_suggestion_sections(
    *,
    chapter: ChapterDetailPayload,
    book_title: Optional[str],
    book_author: Optional[str],
    book_synopsis: Optional[str],
    block: Optional[ParagraphBlockPayload],
    user_instructions: Optional[str] = None,
    context_items: Optional[List[ContextItemPayload]] = None,
    metadata_block: Optional[MetadataBlockPayload] = None,
    scene_block: Optional[SceneBoundaryBlockPayload] = None,
    preceding_blocks: Optional[List[ChapterBlockPayload]] = None,
    following_blocks: Optional[List[ChapterBlockPayload]] = None,
) -> List[str]:
    """Build the common prompt sections used for paragraph suggestions."""

    base_instruction = dedent(
        """
        Eres un asistente editorial que escribe en español neutro. Tu tarea es proponer un párrafo
        coherente con la voz narrativa y los eventos descritos. Mantente fiel al tono del libro y
        evita introducir personajes o información que contradiga el contexto.
        """
    ).strip()

    default_guidance = (
        "Genera una versión mejorada del párrafo cuando haya texto existente o redacta un párrafo"
        " completamente nuevo cuando el bloque esté vacío."
    )

    role_lines = ["### Rol y objetivo", base_instruction]
    if user_instructions and user_instructions.strip():
        role_lines.append("")
        role_lines.append("### Instrucción del usuario")
        role_lines.append(f"{user_instructions.strip()}")
    else:
        role_lines.append(default_guidance)

    target_block_id = block.get("id") if block else None

    sections = [
        "\n".join(role_lines),
        _format_block_section(block),
        _format_book_section(title=book_title, author=book_author, synopsis=book_synopsis),
    ]

    # Add context items if available before listing chapter content
    if context_items:
        context_section = _format_context_items_section(context_items)
        if context_section:
            sections.append(context_section)

    sections.append(_format_chapter_section(chapter, target_block_id=target_block_id))

    # Add scene/metadata context if available
    scene_context = _format_scene_context_section(
        metadata_block=metadata_block,
        scene_block=scene_block,
    )
    if scene_context:
        sections.append(scene_context)

    return [section for section in sections if section]


def build_paragraph_suggestion_prompt_base(
    *,
    chapter: ChapterDetailPayload,
    book_title: Optional[str],
    book_author: Optional[str],
    book_synopsis: Optional[str],
    block: Optional[ParagraphBlockPayload],
    user_instructions: Optional[str] = None,
    context_items: Optional[List[ContextItemPayload]] = None,
    metadata_block: Optional[MetadataBlockPayload] = None,
    scene_block: Optional[SceneBoundaryBlockPayload] = None,
    preceding_blocks: Optional[List[ChapterBlockPayload]] = None,
    following_blocks: Optional[List[ChapterBlockPayload]] = None,
) -> str:
    """Compose the base prompt without response-format instructions."""

    sections = _build_paragraph_suggestion_sections(
        chapter=chapter,
        book_title=book_title,
        book_author=book_author,
        book_synopsis=book_synopsis,
        block=block,
        user_instructions=user_instructions,
        context_items=context_items,
        metadata_block=metadata_block,
        scene_block=scene_block,
        preceding_blocks=preceding_blocks,
        following_blocks=following_blocks,
    )

    sections.append(
        "### Recordatorio final\n"
        "- Mantente fiel al tono del libro, no inventes datos nuevos y responde únicamente en español neutro.\n"
        "- Responde **únicamente** con el párrafo sugerido, sin texto adicional, aclaraciones ni explicaciones."
    )

    return "\n\n".join(sections)


def build_paragraph_suggestion_prompt(
    *,
    chapter: ChapterDetailPayload,
    book_title: Optional[str],
    book_author: Optional[str],
    book_synopsis: Optional[str],
    block: Optional[ParagraphBlockPayload],
    user_instructions: Optional[str] = None,
    context_items: Optional[List[ContextItemPayload]] = None,
    metadata_block: Optional[MetadataBlockPayload] = None,
    scene_block: Optional[SceneBoundaryBlockPayload] = None,
    preceding_blocks: Optional[List[ChapterBlockPayload]] = None,
    following_blocks: Optional[List[ChapterBlockPayload]] = None,
) -> str:
    """Compose the full prompt including response-format instructions."""

    sections = _build_paragraph_suggestion_sections(
        chapter=chapter,
        book_title=book_title,
        book_author=book_author,
        book_synopsis=book_synopsis,
        block=block,
        user_instructions=user_instructions,
        context_items=context_items,
        metadata_block=metadata_block,
        scene_block=scene_block,
        preceding_blocks=preceding_blocks,
        following_blocks=following_blocks,
    )

    sections.append(
        "### Formato de respuesta\n"
        'Devuelve solo un objeto JSON con la forma {"paragraph_suggestion": "texto"}. '
        "Confirma que el párrafo respeta el tono y el contexto proporcionado."
    )

    sections.append(
        "### Recordatorio final\n"
        "Mantente fiel al tono del libro, no inventes datos nuevos y responde únicamente en español neutro."
    )

    return "\n\n".join(sections)
