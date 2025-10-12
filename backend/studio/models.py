"""Typed data models for the studio fixtures."""

from __future__ import annotations

from typing import List, Literal, Optional, TypedDict


def join_paragraphs(paragraphs: List[str]) -> str:
    """Combine paragraph strings into a single chapter body."""
    if not paragraphs:
        return ""
    return "\n\n".join(segment.strip("\n") for segment in paragraphs)


class DialogueTurn(TypedDict, total=False):
    id: str
    speakerId: str
    speakerName: str
    utterance: str
    stageDirection: str
    tone: Literal["whisper", "shout", "thought", "narration"]


class ChapterBlockBase(TypedDict):
    id: str
    type: Literal["paragraph", "dialogue", "scene_boundary", "metadata"]
    position: int


class ParagraphBlock(ChapterBlockBase, total=False):
    type: Literal["paragraph"]
    text: str
    style: Literal["narration", "poem", "aside", "letter"]
    tags: List[str]


class DialogueBlock(ChapterBlockBase, total=False):
    type: Literal["dialogue"]
    turns: List[DialogueTurn]
    context: Optional[str]


class SceneBoundaryBlock(ChapterBlockBase, total=False):
    type: Literal["scene_boundary"]
    label: Optional[str]
    summary: Optional[str]
    locationId: Optional[str]
    locationName: Optional[str]
    timestamp: Optional[str]
    mood: Optional[str]


class MetadataBlock(ChapterBlockBase, total=False):
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


ChapterBlock = ParagraphBlock | DialogueBlock | SceneBoundaryBlock | MetadataBlock


class CharacterItem(TypedDict, total=False):
    id: str
    type: Literal["character"]
    name: str
    role: Optional[str]
    summary: Optional[str]
    tokens: Optional[int]
    checked: bool
    disabled: bool


class WorldItem(TypedDict, total=False):
    id: str
    type: Literal["world"]
    title: str
    summary: Optional[str]
    facts: Optional[str]
    tokens: Optional[int]
    checked: bool
    disabled: bool


class StyleToneItem(TypedDict, total=False):
    id: str
    type: Literal["styleTone"]
    description: str
    tokens: Optional[int]
    checked: bool
    disabled: bool


class ChapterItem(TypedDict, total=False):
    id: str
    type: Literal["chapter"]
    title: str
    tokens: Optional[int]
    checked: bool
    disabled: bool


ContextItem = CharacterItem | WorldItem | StyleToneItem | ChapterItem


class ContextSection(TypedDict, total=False):
    id: str
    title: str
    items: List[ContextItem]
    defaultOpen: bool


class LibraryPayload(TypedDict):
    sections: List[ContextSection]


class EditorPayload(TypedDict):
    content: str
    paragraphs: List[str]
    blocks: List[ChapterBlock]
    tokens: int
    cursor: Optional[int]
    bookId: Optional[str]
    bookTitle: Optional[str]
    chapterId: Optional[str]
    chapterTitle: Optional[str]


class ChapterSummary(TypedDict, total=False):
    id: str
    title: str
    summary: Optional[str]
    ordinal: int
    tokens: Optional[int]
    wordCount: Optional[int]


class ChapterDetail(ChapterSummary, total=False):
    content: str
    paragraphs: List[str]
    blocks: List[ChapterBlock]
    bookId: Optional[str]
    bookTitle: Optional[str]


class LibraryBook(TypedDict, total=False):
    id: str
    title: str
    author: Optional[str]
    synopsis: Optional[str]
    chapters: List[ChapterSummary]


def block_to_text(block: ChapterBlock) -> List[str]:
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
        # Editorial metadata is operational and not part of the prose by default.
        return []

    return []


def blocks_to_paragraphs(blocks: List[ChapterBlock]) -> List[str]:
    paragraphs: List[str] = []
    for block in sorted(blocks, key=lambda b: b.get("position", 0)):
        paragraphs.extend(block_to_text(block))
    return paragraphs
