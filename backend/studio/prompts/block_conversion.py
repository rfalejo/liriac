from __future__ import annotations

from textwrap import dedent
from typing import List, Optional

from ..payloads import ChapterBlockPayload, ChapterDetailPayload


def _render_block_summary(blocks: List[ChapterBlockPayload]) -> str:
    lines: List[str] = []
    for block in blocks:
        block_type = block.get("type")
        if block_type == "paragraph":
            snippet = (block.get("text") or "").strip()
            if snippet:
                lines.append(f"- Párrafo: {snippet[:180]}")
        elif block_type == "dialogue":
            turns = block.get("turns") or []
            if turns:
                speaker = turns[0].get("speakerName") or "Diálogo"
                utterance = (turns[0].get("utterance") or "").strip()
                if utterance:
                    lines.append(f"- Diálogo ({speaker}): {utterance[:180]}")
        elif block_type == "scene_boundary":
            label = block.get("label") or block.get("summary")
            if label:
                lines.append(f"- Escena: {label}")
    if not lines:
        return "(sin bloques relevantes)"
    return "\n".join(lines)


def build_block_conversion_prompt(
    *,
    chapter: Optional[ChapterDetailPayload],
    context_window: Optional[dict],
    source_text: str,
    user_instructions: Optional[str] = None,
) -> str:
    header = dedent(
        """
        Conviertes texto en bloques narrativos para un editor de novelas. Usa español neutro y
        respeta el tono del material fuente. Devuelve exclusivamente bloques de tipo "paragraph"
        y "dialogue" siguiendo el esquema JSON proporcionado.

        Reglas clave:
        - No inventes personajes nuevos; usa los nombres presentes o deja speakerName vacío.
        - Mantén la puntuación y estilo literario originales cuando tenga sentido.
        - Divide el texto en párrafos coherentes. Si hay diálogo, crea un bloque separado de tipo
          "dialogue" e incluye cada intervención como un turno.
        - No incluyas saltos de línea iniciales ni espacios sobrantes en el texto final.
        - Nunca devuelvas IDs ni posiciones; solo el contenido textual.
        """
    ).strip()

    chapter_section = ""
    if chapter:
        pieces: List[str] = ["Contexto del capítulo:"]
        title = chapter.get("title")
        if title:
            pieces.append(f"- Título: {title}")
        summary = chapter.get("summary")
        if summary:
            pieces.append(f"- Resumen: {summary}")
        pieces.append(f"- Número de bloques actuales: {len(chapter.get('blocks', []))}")
        chapter_section = "\n".join(pieces)

    context_section = ""
    if context_window:
        metadata = context_window.get("metadata_block")
        if metadata:
            pov = metadata.get("povCharacterName")
            location = metadata.get("locationName")
            timeline = metadata.get("timelineMarker")
            context_lines: List[str] = ["Contexto narrativo actual:"]
            if pov:
                context_lines.append(f"- Punto de vista: {pov}")
            if location:
                context_lines.append(f"- Ubicación: {location}")
            if timeline:
                context_lines.append(f"- Momento: {timeline}")
            context_section = "\n".join(context_lines)

        scene = context_window.get("scene_block")
        if scene:
            scene_lines: List[str] = ["Escena activa:"]
            label = scene.get("label") or scene.get("summary")
            if label:
                scene_lines.append(f"- Escena: {label}")
            mood = scene.get("mood")
            if mood:
                scene_lines.append(f"- Atmósfera: {mood}")
            context_section = "\n".join(filter(None, [context_section, "\n".join(scene_lines)]))

        preceding = context_window.get("preceding_blocks") or []
        following = context_window.get("following_blocks") or []
        if preceding or following:
            window_lines: List[str] = []
            if preceding:
                window_lines.append("Bloques anteriores:")
                window_lines.append(_render_block_summary(preceding))
            if following:
                window_lines.append("Bloques posteriores:")
                window_lines.append(_render_block_summary(following))
            context_section = "\n".join(filter(None, [context_section, "\n".join(window_lines)]))

    custom_instruction = (
        f"Instrucción adicional del usuario: {user_instructions.strip()}"
        if user_instructions and user_instructions.strip()
        else ""
    )

    source_block = dedent(
        f"""
        Texto fuente a convertir:
        ```
        {source_text.strip()}
        ```
        """
    ).strip()

    schema_section = dedent(
        """
        Responde en formato JSON válido con la forma:
        {
          "blocks": [
            {
              "type": "paragraph",
              "text": "..."
            },
            {
              "type": "dialogue",
              "context": "Contexto opcional del diálogo",
              "turns": [
                {
                  "speakerName": "Nombre opcional",
                  "speakerId": "Identificador opcional",
                  "utterance": "Línea de diálogo",
                  "stageDirection": "Acotación opcional"
                }
              ]
            }
          ]
        }
        """
    ).strip()

    parts = [header]
    if chapter_section:
        parts.append(chapter_section)
    if context_section:
        parts.append(context_section)
    if custom_instruction:
        parts.append(custom_instruction)
    parts.append(source_block)
    parts.append(schema_section)

    return "\n\n".join(part for part in parts if part)
