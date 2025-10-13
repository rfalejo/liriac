from __future__ import annotations

from typing import Dict, List

SAMPLE_LIBRARY_SECTIONS: List[Dict[str, object]] = [
    {
        "id": "chapters",
        "slug": "chapters",
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
        "slug": "characters",
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
        "slug": "world",
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
        "slug": "styleTone",
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


SAMPLE_LIBRARY_BOOKS: List[Dict[str, object]] = [
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


CHAPTER_01_BLOCKS: List[Dict[str, object]] = [
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
                "id": "dialog-ch1-001-turn-01",
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
                "id": "dialog-ch1-001-turn-02",
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
                "id": "dialog-ch1-001-turn-03",
                "speakerId": "char-alyosha",
                "speakerName": "Aliosha",
                "utterance": "—En lo de esa mujer te equivocas. Dmitri… la desprecia",
                "stageDirection": "dijo Aliosha con un estremecimiento",
                "tone": "narration",
            },
            {
                "id": "dialog-ch1-001-turn-04",
                "speakerId": "char-ivan",
                "speakerName": "Iván",
                "utterance": (
                    "—¿A Grúshenka? No, hermano, no la desprecia. Si ha dejado por ella a "
                    "su prometida a la vista de todo el mundo, eso es que no la desprecia."
                ),
                "tone": "narration",
            },
            {
                "id": "dialog-ch1-001-turn-05",
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
                "id": "dialog-ch1-001-turn-06",
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


CHAPTER_02_BLOCKS: List[Dict[str, object]] = [
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
                "id": "dialog-ch2-001-turn-01",
                "speakerId": "char-dmitri",
                "speakerName": "Dmitri",
                "utterance": "—Padre Zósima, vengo a confesarte mi rabia.",
            },
            {
                "id": "dialog-ch2-001-turn-02",
                "speakerId": "char-ivan",
                "speakerName": "Iván",
                "utterance": "—Yo solo quiero escuchar lo que diga el anciano.",
            },
            {
                "id": "dialog-ch2-001-turn-03",
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


SAMPLE_CHAPTER_BLOCKS: Dict[str, List[Dict[str, object]]] = {
    "bk-karamazov-ch-01": CHAPTER_01_BLOCKS,
    "bk-karamazov-ch-02": CHAPTER_02_BLOCKS,
}


DEFAULT_EDITOR_CHAPTER_ID = "bk-karamazov-ch-01"
DEFAULT_EDITOR_TOKEN_BUDGET = 1620


SAMPLE_CHAPTER_METADATA: Dict[str, Dict[str, object]] = {}
for book in SAMPLE_LIBRARY_BOOKS:
    for chapter in book.get("chapters", []):
        SAMPLE_CHAPTER_METADATA[chapter["id"]] = {
            "title": chapter.get("title", ""),
            "summary": chapter.get("summary"),
            "ordinal": chapter.get("ordinal", 0),
            "tokens": chapter.get("tokens"),
            "word_count": chapter.get("wordCount"),
            "book_id": book.get("id"),
            "book_title": book.get("title"),
        }
