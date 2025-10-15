from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional, TypedDict


def join_paragraphs(paragraphs: List[str]) -> str:
    """Combine paragraph strings into a single chapter body."""
    if not paragraphs:
        return ""
    return "\n\n".join(segment.strip("\n") for segment in paragraphs)


class DialogueTurnPayload(TypedDict, total=False):
    id: str
    speakerId: str
    speakerName: str
    utterance: str
    stageDirection: str
    tone: Literal["whisper", "shout", "thought", "narration"]


class ChapterBlockBasePayload(TypedDict):
    id: str
    type: Literal["paragraph", "dialogue", "scene_boundary", "metadata"]
    position: int


class ChapterBlockVersionInfo(TypedDict, total=False):
    activeVersion: int
    versionCount: int


class ParagraphBlockPayload(ChapterBlockBasePayload, ChapterBlockVersionInfo, total=False):
    type: Literal["paragraph"]
    text: str
    style: Literal["narration", "poem", "aside", "letter"]
    tags: List[str]


class DialogueBlockPayload(ChapterBlockBasePayload, ChapterBlockVersionInfo, total=False):
    type: Literal["dialogue"]
    turns: List[DialogueTurnPayload]
    context: Optional[str]


class SceneBoundaryBlockPayload(ChapterBlockBasePayload, ChapterBlockVersionInfo, total=False):
    type: Literal["scene_boundary"]
    label: Optional[str]
    summary: Optional[str]
    locationId: Optional[str]
    locationName: Optional[str]
    timestamp: Optional[str]
    mood: Optional[str]


class MetadataBlockPayload(ChapterBlockBasePayload, ChapterBlockVersionInfo, total=False):
    type: Literal["metadata"]
    kind: Literal["chapter_header", "context", "editorial"]
    title: str
    subtitle: Optional[str]
    ordinal: Optional[int]
    epigraph: Optional[str]
    epigraphAttribution: Optional[str]
    povCharacterId: Optional[str]
    povCharacterName: Optional[str]
    timelineMarker: Optional[str]
    locationId: Optional[str]
    locationName: Optional[str]
    themeTags: List[str]
    status: Literal["draft", "review", "final"]
    owner: Optional[str]
    lastUpdated: Optional[str]


ChapterBlockPayload = (
    ParagraphBlockPayload | DialogueBlockPayload | SceneBoundaryBlockPayload | MetadataBlockPayload
)


class ChapterBlockVersionPayload(TypedDict, total=False):
    version: int
    isActive: bool
    payload: Dict[str, Any]


class ChapterSummaryPayload(TypedDict, total=False):
    id: str
    title: str
    summary: Optional[str]
    ordinal: int
    tokens: Optional[int]
    wordCount: Optional[int]


class ChapterDetailPayload(ChapterSummaryPayload, total=False):
    content: str
    paragraphs: List[str]
    blocks: List[ChapterBlockPayload]
    bookId: Optional[str]
    bookTitle: Optional[str]


class LibraryBookPayload(TypedDict, total=False):
    id: str
    title: str
    author: Optional[str]
    synopsis: Optional[str]
    chapters: List[ChapterSummaryPayload]


class ContextItemPayload(TypedDict, total=False):
    id: str
    type: Literal["character", "world", "styleTone", "chapter"]
    name: str
    role: Optional[str]
    summary: Optional[str]
    title: Optional[str]
    description: Optional[str]
    facts: Optional[str]
    tokens: Optional[int]
    checked: bool
    disabled: bool
    chapterId: Optional[str]
    visibleForChapter: bool


class ContextSectionPayload(TypedDict, total=False):
    id: str
    title: str
    items: List[ContextItemPayload]
    defaultOpen: bool


class LibraryPayload(TypedDict):
    sections: List[ContextSectionPayload]


class EditorPayload(TypedDict, total=False):
    content: str
    paragraphs: List[str]
    blocks: List[ChapterBlockPayload]
    tokens: int
    cursor: Optional[int]
    bookId: Optional[str]
    bookTitle: Optional[str]
    chapterId: Optional[str]
    chapterTitle: Optional[str]


def block_to_text(block: ChapterBlockPayload) -> List[str]:
    """Convert a block payload into zero or more plain-text paragraphs."""
    block_type = block["type"]

    if block_type == "paragraph":
        text = block.get("text", "")
        return [text] if text else []

    if block_type == "dialogue":
        lines: List[str] = []
        for turn in block.get("turns", []) or []:
            utterance = turn.get("utterance", "").strip()
            if not utterance:
                continue
            attachment = turn.get("stageDirection")
            if attachment:
                lines.append(f"{utterance} {attachment}".strip())
            else:
                lines.append(utterance)
        if lines:
            return ["\n".join(lines)]
        return []

    if block_type == "scene_boundary":
        label = block.get("label")
        summary = block.get("summary")
        if label or summary:
            pieces = [piece for piece in [label, summary] if piece]
            return ["[Escena] " + " — ".join(pieces)]
        return []

    if block_type == "metadata":
        kind = block.get("kind")
        if kind == "chapter_header":
            lines = [
                element
                for element in [
                    block.get("title"),
                    block.get("subtitle"),
                    block.get("epigraph"),
                ]
                if element
            ]
            if lines:
                return ["\n".join(lines)]
        if kind == "context":
            pov = block.get("povCharacterName")
            marker = block.get("timelineMarker")
            location = block.get("locationName")
            pieces = [piece for piece in [pov, location, marker] if piece]
            if pieces:
                return ["[Contexto] " + " — ".join(pieces)]
        return []

    return []


def blocks_to_paragraphs(blocks: List[ChapterBlockPayload]) -> List[str]:
    paragraphs: List[str] = []
    for block in sorted(blocks, key=lambda b: b.get("position", 0)):
        paragraphs.extend(block_to_text(block))
    return paragraphs


def chapter_detail_from_blocks(
    *,
    chapter_id: str,
    title: str,
    ordinal: int,
    summary: Optional[str],
    tokens: Optional[int],
    word_count: Optional[int],
    blocks: List[ChapterBlockPayload],
    book_id: Optional[str],
    book_title: Optional[str],
) -> ChapterDetailPayload:
    paragraphs = blocks_to_paragraphs(blocks)
    return {
        "id": chapter_id,
        "title": title,
        "summary": summary,
        "ordinal": ordinal,
        "tokens": tokens,
        "wordCount": word_count,
        "paragraphs": paragraphs,
        "content": join_paragraphs(paragraphs),
        "blocks": blocks,
        "bookId": book_id,
        "bookTitle": book_title,
    }


def build_editor_state(
    *,
    source: ChapterDetailPayload,
    token_budget: int,
) -> EditorPayload:
    return {
        "paragraphs": source["paragraphs"],
        "content": source["content"],
        "blocks": source["blocks"],
        "tokens": token_budget,
        "cursor": None,
        "bookId": source.get("bookId"),
        "bookTitle": source.get("bookTitle"),
        "chapterId": source.get("id"),
        "chapterTitle": source.get("title"),
    }
