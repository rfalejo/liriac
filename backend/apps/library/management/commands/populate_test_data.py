import hashlib

from typing import Any, TypedDict

from django.core.management.base import BaseCommand

from apps.library.models import Book, Chapter, ChapterVersion, Persona


class Command(BaseCommand):
    help = 'Populates the database with test data including books, chapters, and personas'

    def handle(self, *args: str, **options: Any) -> None:
        self.stdout.write('Creating test data...')

        # Create a test book
        book = Book.objects.create(
            title='The Art of Programming',
            slug='the-art-of-programming'
        )

        # Define type for chapter data
        class ChapterData(TypedDict):
            title: str
            body: str
            order: int

        # Create chapters for the book
        chapters: list[ChapterData] = [
            {
                'title': 'Introduction to Programming',
                'body': '# Introduction\n\nWelcome to the world of programming! This chapter will introduce you to fundamental concepts.\n\n## What is Programming?\n\nProgramming is the process of creating instructions for computers to execute.',
                'order': 1
            },
            {
                'title': 'Variables and Data Types',
                'body': '# Variables and Data Types\n\nVariables are containers for storing data values. In programming, different types of data require different handling.\n\n## Common Data Types:\n- **Integer**: Whole numbers\n- **String**: Text data\n- **Boolean**: True/False values\n- **Float**: Decimal numbers',
                'order': 2
            },
            {
                'title': 'Control Structures',
                'body': '# Control Structures\n\nControl structures allow you to control the flow of your program execution.\n\n## Conditional Statements\n\n```python\nif condition:\n    # do something\nelif another_condition:\n    # do something else\nelse:\n    # fallback\n```\n\n## Loops\n\n```python\nfor item in collection:\n    process(item)\n\nwhile condition:\n    # repeat until false\n```',
                'order': 3
            },
            {
                'title': 'Functions and Methods',
                'body': '# Functions and Methods\n\nFunctions are reusable blocks of code that perform specific tasks.\n\n## Defining Functions\n\n```python\ndef greet(name):\n    """Simple greeting function"""\n    return f"Hello, {name}!"\n\n# Function with parameters\ndef calculate_area(length, width):\n    return length * width\n```',
                'order': 4
            },
            {
                'title': 'Object-Oriented Programming',
                'body': '# Object-Oriented Programming\n\nOOP is a programming paradigm based on the concept of "objects".\n\n## Classes and Objects\n\n```python\nclass Car:\n    def __init__(self, make, model, year):\n        self.make = make\n        self.model = model\n        self.year = year\n    \n    def start_engine(self):\n        return f"The {self.make} {self.model} engine is starting!"\n```',
                'order': 5
            }
        ]

        created_chapters = []
        for chapter_data in chapters:
            body_hash = hashlib.sha256(chapter_data['body'].encode('utf-8')).hexdigest()
            chapter = Chapter.objects.create(
                book=book,
                title=chapter_data['title'],
                body=chapter_data['body'],
                checksum=body_hash,
                order=chapter_data['order']
            )
            created_chapters.append(chapter)

        # Create personas for writing assistance
        personas = [
            {
                'name': 'Technical Editor',
                'role': 'Editor',
                'notes': 'Focuses on technical accuracy, clarity, and proper documentation'
            },
            {
                'name': 'Creative Writer',
                'role': 'Writer',
                'notes': 'Helps with creative expression, engaging narratives, and reader-friendly content'
            },
            {
                'name': 'Grammar Expert',
                'role': 'Editor',
                'notes': 'Ensures proper grammar, spelling, and punctuation throughout the content'
            },
            {
                'name': 'Structure Specialist',
                'role': 'Editor',
                'notes': 'Optimizes content organization, headings, and overall document structure'
            }
        ]

        created_personas = []
        for persona_data in personas:
            persona = Persona.objects.create(
                name=persona_data['name'],
                role=persona_data['role'],
                notes=persona_data['notes']
            )
            created_personas.append(persona)

        # Create some chapter versions for the first chapter
        first_chapter = created_chapters[0]
        ChapterVersion.objects.create(
            chapter=first_chapter,
            body=first_chapter.body,
            checksum=first_chapter.checksum,
            diff_size=0
        )

        # Output summary
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created test data:\n'
                f'- 1 Book: "{book.title}"\n'
                f'- {len(created_chapters)} Chapters\n'
                f'- {len(created_personas)} Personas\n'
                f'- 1 ChapterVersion snapshot'
            )
        )
