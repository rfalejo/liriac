from __future__ import annotations

from typing import List, Literal, Optional, TypedDict


def join_paragraphs(paragraphs: List[str]) -> str:
    """Combine paragraph strings into a single chapter body."""
    if not paragraphs:
        return ""
    return "\n\n".join(segment.strip("\n") for segment in paragraphs)


class DialogueTurn(TypedDict, total=False):
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


LIBRARY_SECTIONS: List[ContextSection] = [
    {
        "id": "chapters",
        "title": "Capítulos",
        "defaultOpen": True,
        "items": [
            {
                "id": "bk-karamazov-ch-01",
                "type": "chapter",
                "title": "I — Fyodor Pavlovich Karamázov",
                "tokens": 880,
                "checked": True,
            },
            {
                "id": "bk-karamazov-ch-02",
                "type": "chapter",
                "title": "II — En casa del padre",
                "tokens": 910,
                "checked": False,
            },
        ],
    },
    {
        "id": "characters",
        "title": "Personajes",
        "defaultOpen": False,
        "items": [
            {
                "id": "char-ivan",
                "type": "character",
                "name": "Iván Karamázov",
                "role": "Hermano mayor",
                "summary": "Intelectual escéptico, afilado y retorcido.",
                "tokens": 210,
                "checked": True,
            },
            {
                "id": "char-alyosha",
                "type": "character",
                "name": "Aliosha Karamázov",
                "role": "Hermano menor",
                "summary": "Alumno del monasterio, corazón compasivo.",
                "tokens": 180,
                "checked": True,
            },
            {
                "id": "char-dmitri",
                "type": "character",
                "name": "Dmitri (Mitia) Karamázov",
                "role": "Hermano del medio",
                "summary": "Apasionado, impulsivo y celoso.",
                "tokens": 195,
                "checked": False,
            },
        ],
    },
    {
        "id": "world",
        "title": "Mundo",
        "defaultOpen": False,
        "items": [
            {
                "id": "world-skotoprigonievski",
                "type": "world",
                "title": "Skotoprigonievski",
                "summary": "Pueblo ruso cubierto de barro y rumores, escenario principal.",
                "tokens": 160,
                "checked": True,
            },
            {
                "id": "world-casa-karamazov",
                "type": "world",
                "title": "Casa de Fyodor Pavlovich",
                "summary": "Salones en ruina, olor a aguardiente y velas consumidas.",
                "tokens": 120,
                "checked": False,
            },
        ],
    },
    {
        "id": "styleTone",
        "title": "Estilo y tono",
        "defaultOpen": False,
        "items": [
            {
                "id": "tone-russo-gotico",
                "type": "styleTone",
                "description": "Narrador omnisciente con ironía contenida.",
                "tokens": 45,
                "checked": True,
            },
            {
                "id": "tone-confesional",
                "type": "styleTone",
                "description": "Confesiones febriles al borde de la tragedia.",
                "tokens": 30,
                "checked": False,
            },
        ],
    },
]


LIBRARY_BOOKS: List[LibraryBook] = [
    {
        "id": "bk-karamazov",
        "title": "Los hermanos Karamázov",
        "author": "Fiódor Dostoyevski",
        "synopsis": (
            "Los hijos de Fyodor Pavlovich se debaten entre la fe, la razón y la pasión "
            "mientras una muerte anunciada se insinúa en cada conversación."
        ),
        "chapters": [
            {
                "id": "bk-karamazov-ch-01",
                "title": "Libro I — Capítulo I: Fyodor Pavlovich Karamázov",
                "summary": "Presentación del patriarca y de su casa en ruinas.",
                "ordinal": 1,
                "tokens": 880,
                "wordCount": 2450,
            },
            {
                "id": "bk-karamazov-ch-02",
                "title": "Libro I — Capítulo II: Los tres hermanos",
                "summary": "Reencuentro incómodo de Iván, Dmitri y Aliosha.",
                "ordinal": 2,
                "tokens": 910,
                "wordCount": 2600,
            },
        ],
    }
]


CHAPTER_01_BLOCKS: List[ChapterBlock] = [
    {
        "id": "meta-ch1-header",
        "type": "metadata",
        "position": 0,
        "kind": "chapter_header",
        "title": "Libro I — Los hermanos Karamázov",
        "subtitle": "Capítulo I: Fyodor Pavlovich Karamázov",
        "ordinal": 1,
        "epigraph": "La lujuria es nuestro fuego y nuestra vergüenza.",
        "epigraphAttribution": "Monje Zósima",
    },
    {
        "id": "meta-ch1-context",
        "type": "metadata",
        "position": 5,
        "kind": "context",
        "povCharacterName": "Narrador omnisciente",
        "timelineMarker": "Tarde húmeda de otoño",
        "locationName": "Casa de los Karamázov",
        "themeTags": ["familia", "fe", "pasión"],
    },
    {
        "id": "scene-ch1-salon",
        "type": "scene_boundary",
        "position": 10,
        "label": "Salón en penumbra",
        "summary": "Fyodor espera a sus hijos entre copas y sarcasmos.",
        "locationName": "Casa de Fyodor Pavlovich",
        "timestamp": "Después del anochecer",
        "mood": "asfixiante",
    },
    {
        "id": "para-ch1-001",
        "type": "paragraph",
        "position": 20,
        "text": (
            "Fyodor Pavlovich Karamázov estaba convencido de que la desgracia "
            "resultaba más sabrosa si podía saborearla frente a un público. Esa noche "
            "esperaba con un vaso de vodka en la mano y una sonrisa torcida la llegada "
            "de sus tres hijos."
        ),
        "style": "narration",
        "tags": ["introduccion"],
    },
    {
        "id": "para-ch1-002",
        "type": "paragraph",
        "position": 30,
        "text": (
            "Los criados se movían como sombras, entre candelabros derretidos y "
            "tapices húmedos. Iván repasaba mentalmente un argumento ateo, Dmitri "
            "subía la escalera de dos en dos y Aliosha acariciaba su rosario con manos "
            "temblorosas."
        ),
        "style": "narration",
        "tags": ["descripcion"],
    },
    {
        "id": "dialog-ch1-001",
        "type": "dialogue",
        "position": 40,
        "context": "Iván desafía la calma de Aliosha.",
        "turns": [
            {
                "speakerId": "char-ivan",
                "speakerName": "Iván",
                "utterance": (
                    "—Entonces, ¿por qué estás temblando de pies a cabeza? ¿Acaso no "
                    "conoces el percal? Por muy honrado que sea, Mítenka (que es tonto, "
                    "pero honrado) es un hombre lujurioso."
                ),
                "tone": "narration",
            },
            {
                "speakerId": "char-ivan",
                "speakerName": "Iván",
                "utterance": (
                    "Ésa es su definición, en eso reside toda su esencia. Ha sido el padre "
                    "quien le ha transmitido toda su abyecta lujuria. El único que me "
                    "tiene asombrado eres tú, Aliosha: ¿cómo puedes conservarte virgen?"
                ),
                "tone": "narration",
            },
            {
                "speakerId": "char-alyosha",
                "speakerName": "Aliosha",
                "utterance": "—En lo de esa mujer te equivocas. Dmitri… la desprecia",
                "stageDirection": "dijo Aliosha con un estremecimiento",
                "tone": "narration",
            },
            {
                "speakerId": "char-ivan",
                "speakerName": "Iván",
                "utterance": (
                    "—¿A Grúshenka? No, hermano, no la desprecia. Si ha dejado por ella a "
                    "su prometida a la vista de todo el mundo, eso es que no la desprecia."
                ),
                "tone": "narration",
            },
            {
                "speakerId": "char-ivan",
                "speakerName": "Iván",
                "utterance": (
                    "Si un hombre se enamora de una belleza determinada es capaz de dar "
                    "por ella a sus propios hijos, de vender a su padre y a su madre, aunque "
                    "sea honrado, robará; aunque sea pacífico, degollará."
                ),
                "tone": "narration",
            },
            {
                "speakerId": "char-alyosha",
                "speakerName": "Aliosha",
                "utterance": "—Eso yo lo comprendo",
                "stageDirection": "se le escapó de pronto a Aliosha",
                "tone": "narration",
            },
        ],
    },
    {
        "id": "para-ch1-003",
        "type": "paragraph",
        "position": 50,
        "text": (
            "Un chirrido de puerta anunció la llegada de Dmitri. La tensión se volvió "
            "palpable, como si cada palabra pronunciada incendiara el aire cargado de "
            "iconos y resaca."
        ),
        "style": "narration",
        "tags": ["transicion"],
    },
    {
        "id": "scene-ch1-escalera",
        "type": "scene_boundary",
        "position": 60,
        "label": "Escalera principal",
        "summary": "Dmitri irrumpe, cargado de celos y aguardiente.",
        "locationName": "Casa de Fyodor Pavlovich",
        "timestamp": "Instantes después",
        "mood": "explosivo",
    },
    {
        "id": "meta-ch1-editorial",
        "type": "metadata",
        "position": 70,
        "kind": "editorial",
        "status": "draft",
        "owner": "equipo-local",
        "lastUpdated": "2025-10-10T22:17:00Z",
    },
]


CHAPTER_02_BLOCKS: List[ChapterBlock] = [
    {
        "id": "meta-ch2-header",
        "type": "metadata",
        "position": 0,
        "kind": "chapter_header",
        "title": "Libro I — Los hermanos Karamázov",
        "subtitle": "Capítulo II: Los tres hermanos",
        "ordinal": 2,
    },
    {
        "id": "meta-ch2-context",
        "type": "metadata",
        "position": 5,
        "kind": "context",
        "povCharacterName": "Aliosha",
        "timelineMarker": "Medianoche",
        "locationName": "Celda del starets",
        "themeTags": ["fe", "culpa"],
    },
    {
        "id": "scene-ch2-monasterio",
        "type": "scene_boundary",
        "position": 10,
        "label": "Monasterio",
        "summary": "Los hermanos aguardan la palabra del starets.",
        "locationName": "Monasterio de Optina",
    },
    {
        "id": "para-ch2-001",
        "type": "paragraph",
        "position": 20,
        "text": (
            "El aire dentro de la celda olía a pan negro y a incienso. Iván permanecía "
            "en silencio, Dmitri apretaba los puños y Aliosha esperaba con fervor una "
            "gota de claridad."
        ),
        "style": "narration",
    },
    {
        "id": "dialog-ch2-001",
        "type": "dialogue",
        "position": 30,
        "turns": [
            {
                "speakerId": "char-dmitri",
                "speakerName": "Dmitri",
                "utterance": "—Padre Zósima, vengo a confesarte mi rabia.",
            },
            {
                "speakerId": "char-ivan",
                "speakerName": "Iván",
                "utterance": "—Yo solo quiero escuchar lo que diga el anciano.",
            },
            {
                "speakerId": "char-alyosha",
                "speakerName": "Aliosha",
                "utterance": "—Lo que digamos aquí nos marca para siempre",
            },
        ],
    },
    {
        "id": "para-ch2-002",
        "type": "paragraph",
        "position": 40,
        "text": (
            "El starets cerró los ojos, como si escuchara un rumor lejano, y los "
            "hermanos contuvieron la respiración al mismo tiempo."
        ),
        "style": "narration",
    },
]


def chapter_detail_from_blocks(
    *,
    chapter_id: str,
    title: str,
    ordinal: int,
    summary: str,
    tokens: int,
    word_count: int,
    blocks: List[ChapterBlock],
) -> ChapterDetail:
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
        "bookId": "bk-karamazov",
        "bookTitle": "Los hermanos Karamázov",
    }


CHAPTER_DETAILS = {
    "bk-karamazov-ch-01": chapter_detail_from_blocks(
        chapter_id="bk-karamazov-ch-01",
        title="Libro I — Capítulo I: Fyodor Pavlovich Karamázov",
        summary="Fyodor aguarda a sus hijos y el aire se vuelve irrespirable.",
        ordinal=1,
        tokens=880,
        word_count=2450,
        blocks=CHAPTER_01_BLOCKS,
    ),
    "bk-karamazov-ch-02": chapter_detail_from_blocks(
        chapter_id="bk-karamazov-ch-02",
        title="Libro I — Capítulo II: Los tres hermanos",
        summary="Los hermanos se reúnen ante el starets para buscar juicio.",
        ordinal=2,
        tokens=910,
        word_count=2600,
        blocks=CHAPTER_02_BLOCKS,
    ),
}


EDITOR_STATE: EditorPayload = {
    "paragraphs": CHAPTER_DETAILS["bk-karamazov-ch-01"]["paragraphs"],
    "content": CHAPTER_DETAILS["bk-karamazov-ch-01"]["content"],
    "blocks": CHAPTER_DETAILS["bk-karamazov-ch-01"]["blocks"],
    "tokens": 1620,
    "cursor": None,
    "bookId": "bk-karamazov",
    "bookTitle": "Los hermanos Karamázov",
    "chapterId": "bk-karamazov-ch-01",
    "chapterTitle": "Libro I — Capítulo I: Fyodor Pavlovich Karamázov",
}

