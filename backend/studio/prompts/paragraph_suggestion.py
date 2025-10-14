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


def _first_sentence(text: str, *, max_length: int = 240) -> str:
    """Return the first sentence-like chunk within the length budget."""

    clean = text.replace("\n", " ").strip()
    if not clean:
        return ""

    for delimiter in [". ", "? ", "! "]:
        if delimiter in clean:
            clean = clean.split(delimiter, 1)[0] + delimiter.strip()
            break

    if len(clean) > max_length:
        clean = clean[: max_length - 3].rstrip() + "..."
    return clean


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


def _format_chapter_section(chapter: ChapterDetailPayload) -> str:
    lines = ["### Contexto del capítulo"]
    lines.append(f"- Título: {chapter.get('title', '')}")
    summary = chapter.get("summary")
    if summary:
        lines.append(f"- Resumen: {summary}")
    ordinal = chapter.get("ordinal")
    if ordinal is not None:
        lines.append(f"- Número de capítulo: {ordinal}")
    lines.append("- Párrafos actuales (extractos):")
    paragraphs = chapter.get("paragraphs", [])
    if not paragraphs:
        lines.append("  (sin contenido)")
    else:
        for index, paragraph in enumerate(paragraphs, start=1):
            excerpt = _first_sentence(paragraph)
            lines.append(f"  {index}. {excerpt}")
    return "\n".join(lines)


def _format_context_items_section(context_items: List[ContextItemPayload]) -> str:
    """Format active library context items (characters, world, style/tone)."""
    if not context_items:
        return ""

    # Group by type
    characters = [item for item in context_items if item.get("type") == "character"]
    world_items = [item for item in context_items if item.get("type") == "world"]
    style_items = [item for item in context_items if item.get("type") == "styleTone"]

    lines: List[str] = []
    total = len(context_items)
    lines.append(f"### Contexto seleccionado en la biblioteca ({total} elementos)")

    if characters:
        lines.append("- Personajes clave:")
        for char in characters:
            name = char.get("name", "")
            role = char.get("role")
            summary = char.get("summary")
            entry = f"  • {name}"
            if role:
                entry += f" ({role})"
            if summary:
                entry += f": {summary}"
            lines.append(entry)

    if world_items:
        lines.append("- Detalles del mundo:")
        for item in world_items:
            name = item.get("name") or item.get("title", "")
            description = item.get("description") or item.get("summary")
            entry = f"  • {name}"
            if description:
                entry += f": {description}"
            lines.append(entry)

    if style_items:
        lines.append("- Notas de estilo y tono:")
        for item in style_items:
            name = item.get("name") or "Estilo"
            description = item.get("description")
            entry = f"  • {name}"
            if description:
                entry += f": {description}"
            lines.append(entry)

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


def _format_surrounding_blocks_section(
    *,
    preceding_blocks: List[ChapterBlockPayload],
    following_blocks: List[ChapterBlockPayload],
) -> str:
    """Format text from surrounding blocks for narrative continuity."""
    lines = []

    if preceding_blocks:
        lines.append("### Bloques precedentes (resumen)")
        for idx, block in enumerate(preceding_blocks, start=1):
            block_text = _extract_block_preview(block)
            if block_text:
                lines.append(f"  {idx}. {block_text}")

    if following_blocks:
        if lines:
            lines.append("")
        lines.append("### Bloques siguientes (resumen)")
        for idx, block in enumerate(following_blocks, start=1):
            block_text = _extract_block_preview(block)
            if block_text:
                lines.append(f"  {idx}. {block_text}")

    return "\n".join(lines) if lines else ""


def _extract_block_preview(block: ChapterBlockPayload, max_length: int = 200) -> str:
    """Extract a text preview from any block type."""
    block_type = block.get("type")

    if block_type == "paragraph":
        text = block.get("text", "")
        style = block.get("style")
        prefix = f"[{style}] " if style and style != "narration" else ""
        preview = _first_sentence(text, max_length=max_length)
        if not preview:
            return ""
        return prefix + preview

    elif block_type == "dialogue":
        turns = block.get("turns", [])
        if not turns:
            return "[diálogo vacío]"
        first_turn = turns[0]
        speaker = first_turn.get("speakerName", "")
        utterance = first_turn.get("utterance", "")
        preview = f"{speaker}: {utterance}" if speaker else utterance
        if len(preview) > max_length:
            preview = preview[: max_length - 3] + "..."
        return f"[diálogo] {preview}"

    elif block_type == "scene_boundary":
        label = block.get("label", "")
        summary = block.get("summary", "")
        text = label or summary or "cambio de escena"
        if len(text) > max_length:
            text = text[: max_length - 3] + "..."
        return f"[escena] {text}"

    elif block_type == "metadata":
        kind = block.get("kind", "")
        title = block.get("title", "")
        return f"[{kind}] {title}" if title else f"[{kind}]"

    return ""


def _format_block_section(block: Optional[ParagraphBlockPayload]) -> str:
    """Format the target paragraph block with its style information."""
    if block is None:
        return "### Bloque objetivo\nBloque objetivo: (sin contenido)"

    text = block.get("text") if block else None
    style = block.get("style")
    tags = block.get("tags", [])

    lines = ["### Bloque objetivo"]

    if style and style != "narration":
        lines.append(f"- Estilo: {style}")

    if tags:
        lines.append(f"- Etiquetas: {', '.join(tags)}")

    lines.append(f"- Texto: {text}" if text else "- Texto: (sin contenido)")

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

    guidance = (
        user_instructions.strip()
        if user_instructions
        else (
            "Genera una versión mejorada del párrafo cuando haya texto existente o redacta un párrafo"
            " completamente nuevo cuando el bloque esté vacío."
        )
    )

    sections = [
        "### Rol y objetivo",
        base_instruction,
        "### Directiva actual",
        guidance,
        _format_block_section(block),
        _format_book_section(title=book_title, author=book_author, synopsis=book_synopsis),
        _format_chapter_section(chapter),
    ]
    # Add context items if available
    if context_items:
        context_section = _format_context_items_section(context_items)
        if context_section:
            sections.append(context_section)

    # Add scene/metadata context if available
    scene_context = _format_scene_context_section(
        metadata_block=metadata_block,
        scene_block=scene_block,
    )
    if scene_context:
        sections.append(scene_context)

    # Add surrounding blocks for continuity
    if preceding_blocks or following_blocks:
        surrounding = _format_surrounding_blocks_section(
            preceding_blocks=preceding_blocks or [],
            following_blocks=following_blocks or [],
        )
        if surrounding:
            sections.append(surrounding)

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
        "Mantente fiel al tono del libro, no inventes datos nuevos y responde únicamente en español neutro."
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
