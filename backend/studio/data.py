from __future__ import annotations

from typing import TypedDict, Literal, List, Dict, Optional


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
    bookId: Optional[str]
    bookTitle: Optional[str]


class LibraryBook(TypedDict, total=False):
    id: str
    title: str
    author: Optional[str]
    synopsis: Optional[str]
    chapters: List[ChapterSummary]


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


LIBRARY_BOOKS: List[LibraryBook] = [
    {
        "id": "bk-el-viajero",
        "title": "El viajero",
        "author": "R. Falejo",
        "synopsis": (
            "A drifter arrives at the port city of San Aurelio and uncovers the hidden "
            "currents pulling the community apart."
        ),
        "chapters": [
            {
                "id": "ch-01",
                "title": "01 — Partida",
                "summary": "Michelle prepares to leave the mainland behind.",
                "ordinal": 1,
                "tokens": 560,
                "wordCount": 2100,
            },
            {
                "id": "ch-02",
                "title": "02 — Preparativos",
                "summary": "Packing memories and supplies for the crossing.",
                "ordinal": 2,
                "tokens": 540,
                "wordCount": 2045,
            },
            {
                "id": "ch-03",
                "title": "03 — El puerto",
                "summary": "Arrival at the bustling port and a meeting with Arturo.",
                "ordinal": 3,
                "tokens": 680,
                "wordCount": 2550,
            },
            {
                "id": "ch-04",
                "title": "04 — Mareas",
                "summary": "Tides and secrets rise in equal measure.",
                "ordinal": 4,
                "tokens": 720,
                "wordCount": 2675,
            },
        ],
    },
    {
        "id": "bk-la-luz",
        "title": "La luz sumergida",
        "author": "C. Menéndez",
        "synopsis": "Mysteries ripple through an underwater research station.",
        "chapters": [
            {
                "id": "ll-01",
                "title": "01 — Presión",
                "summary": "A diver senses something watching beyond the glass dome.",
                "ordinal": 1,
                "tokens": 610,
                "wordCount": 2310,
            },
            {
                "id": "ll-02",
                "title": "02 — Resonancia",
                "summary": "An experimental sonar array records impossible echoes.",
                "ordinal": 2,
                "tokens": 640,
                "wordCount": 2460,
            },
        ],
    },
]


CHAPTER_DETAILS: Dict[str, ChapterDetail] = {
    "ch-01": {
        "id": "ch-01",
        "title": "01 — Partida",
        "summary": "Michelle prepares to leave the mainland behind.",
        "ordinal": 1,
        "tokens": 560,
        "wordCount": 2100,
        "bookId": "bk-el-viajero",
        "bookTitle": "El viajero",
        "content": (
            "Michelle empezó a empacar al amanecer. El cielo aún guardaba los colores "
            "de la noche cuando dobló la última camisa y la escondió junto a los cuadernos.\n\n"
            "La estación bullía de viajeros con historias suspendidas. Ella sólo quería "
            "alcanzar el ferry antes de que cambiara el viento."
        ),
    },
    "ch-02": {
        "id": "ch-02",
        "title": "02 — Preparativos",
        "summary": "Packing memories and supplies for the crossing.",
        "ordinal": 2,
        "tokens": 540,
        "wordCount": 2045,
        "bookId": "bk-el-viajero",
        "bookTitle": "El viajero",
        "content": (
            "Arturo revisó la lista dos veces. Las mareas serían traicioneras y no "
            "podían darse el lujo de olvidar una sola cuerda.\n\n"
            "Entre las cajas, Michelle encontró el mapa antiguo del puerto; las anotaciones "
            "al margen parecían invitarla a descifrar un mensaje."
        ),
    },
    "ch-03": {
        "id": "ch-03",
        "title": "03 — El puerto",
        "summary": "Arrival at the bustling port and a meeting with Arturo.",
        "ordinal": 3,
        "tokens": 680,
        "wordCount": 2550,
        "bookId": "bk-el-viajero",
        "bookTitle": "El viajero",
        "content": (
            "The pier smelled of salt and damp wood.\n\n"
            "Gulls carved lazy circles above the flat water while ropes creaked with every swell.\n\n"
            "Michelle pressed the notebook to her chest and exhaled deeply. She expected no "
            "answers, only the murmur of the sea and the thud of her boots.\n\n…"
        ),
    },
    "ch-04": {
        "id": "ch-04",
        "title": "04 — Mareas",
        "summary": "Tides and secrets rise in equal measure.",
        "ordinal": 4,
        "tokens": 720,
        "wordCount": 2675,
        "bookId": "bk-el-viajero",
        "bookTitle": "El viajero",
        "content": (
            "El oleaje golpeó los pilotes con una cadencia inquieta.\n\n"
            "Las luces del puerto titilaron y, por un instante, todo pareció contener la respiración."
        ),
    },
    "ll-01": {
        "id": "ll-01",
        "title": "01 — Presión",
        "summary": "A diver senses something watching beyond the glass dome.",
        "ordinal": 1,
        "tokens": 610,
        "wordCount": 2310,
        "bookId": "bk-la-luz",
        "bookTitle": "La luz sumergida",
        "content": (
            "Dentro de la estación submarina, Alma escuchó el crujir tenue de los paneles.\n\n"
            "Un destello azul cruzó más allá del domo y el agua pareció latir con ritmo propio."
        ),
    },
    "ll-02": {
        "id": "ll-02",
        "title": "02 — Resonancia",
        "summary": "An experimental sonar array records impossible echoes.",
        "ordinal": 2,
        "tokens": 640,
        "wordCount": 2460,
        "bookId": "bk-la-luz",
        "bookTitle": "La luz sumergida",
        "content": (
            "El sonar devolvió una serie de pulsos que no coincidían con ningún registro.\n\n"
            "Los técnicos se miraron en silencio mientras el gráfico dibujaba un patrón espiral."
        ),
    },
}


EDITOR_STATE: EditorPayload = {
    "content": (
        "The pier smelled of salt and damp wood.\n\n"
        "Gulls carved lazy circles above the flat water while ropes creaked with every swell.\n\n"
        "Michelle pressed the notebook to her chest and exhaled deeply. She expected no answers, only the murmur of the sea and the thud of her boots.\n\n"
        "…"
    ),
    "tokens": 1620,
    "cursor": None,
    "bookId": "bk-el-viajero",
    "bookTitle": "El viajero",
    "chapterId": "ch-03",
    "chapterTitle": "03 — El puerto",
}
