from __future__ import annotations

from typing import TypedDict, Literal, List


CharacterItem = TypedDict(
    "CharacterItem",
    {
        "id": str,
        "type": Literal["character"],
        "name": str,
        "role": str | None,
        "summary": str | None,
        "tokens": int | None,
        "checked": bool,
        "disabled": bool,
    },
    total=False,
)


WorldItem = TypedDict(
    "WorldItem",
    {
        "id": str,
        "type": Literal["world"],
        "title": str,
        "summary": str | None,
        "facts": str | None,
        "tokens": int | None,
        "checked": bool,
        "disabled": bool,
    },
    total=False,
)


StyleToneItem = TypedDict(
    "StyleToneItem",
    {
        "id": str,
        "type": Literal["styleTone"],
        "description": str,
        "tokens": int | None,
        "checked": bool,
        "disabled": bool,
    },
    total=False,
)


ChapterItem = TypedDict(
    "ChapterItem",
    {
        "id": str,
        "type": Literal["chapter"],
        "title": str,
        "tokens": int | None,
        "checked": bool,
        "disabled": bool,
    },
    total=False,
)


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
    tokens: int
    cursor: int | None


LIBRARY_SECTIONS: List[ContextSection] = [
    {
        "id": "chapters",
        "title": "Chapters",
        "defaultOpen": False,
        "items": [
            {
                "id": "ch-03",
                "type": "chapter",
                "title": "03 — El puerto",
                "tokens": 680,
                "checked": True,
            },
            {
                "id": "ch-02",
                "type": "chapter",
                "title": "02 — Preparativos",
                "tokens": 540,
                "checked": False,
            },
            {
                "id": "ch-04",
                "type": "chapter",
                "title": "04 — Mareas",
                "tokens": 720,
                "checked": False,
            },
        ],
    },
    {
        "id": "characters",
        "title": "Characters",
        "defaultOpen": False,
        "items": [
            {
                "id": "char-michelle",
                "type": "character",
                "name": "Michelle",
                "role": "Protagonist",
                "tokens": 120,
                "checked": True,
            },
            {
                "id": "char-arturo",
                "type": "character",
                "name": "Arturo",
                "role": "Supporting",
                "tokens": 80,
                "checked": True,
            },
            {
                "id": "char-port",
                "type": "character",
                "name": "Port Authority",
                "role": "Minor",
                "tokens": 40,
                "checked": False,
            },
        ],
    },
    {
        "id": "world",
        "title": "World info",
        "defaultOpen": False,
        "items": [
            {
                "id": "wi-port",
                "type": "world",
                "title": "The Port of San Aurelio",
                "tokens": 150,
                "checked": True,
            },
            {
                "id": "wi-ferry",
                "type": "world",
                "title": "Ferry schedules",
                "tokens": 60,
                "checked": False,
            },
        ],
    },
    {
        "id": "styleTone",
        "title": "Writing style & tone",
        "defaultOpen": False,
        "items": [
            {
                "id": "st-house",
                "type": "styleTone",
                "description": "House style: concise, sensory details",
                "tokens": 40,
                "checked": True,
            },
            {
                "id": "st-tone-moody",
                "type": "styleTone",
                "description": "Tone: moody, atmospheric",
                "tokens": 30,
                "checked": False,
            },
        ],
    },
]


EDITOR_STATE: EditorPayload = {
    "content": (
        "The pier smelled of salt and damp wood.\n\n"
        "Gulls carved lazy circles above the flat water while ropes creaked with every swell.\n\n"
        "Michelle pressed the notebook to her chest and exhaled deeply. She expected no answers, only the murmur of the sea and the thud of her boots.\n\n"
        "…"
    ),
    "tokens": 1620,
    "cursor": None,
}
