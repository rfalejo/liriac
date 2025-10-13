from __future__ import annotations

from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse

from studio.models import Book, Chapter

ORIGIN = "http://localhost:5173"


class LibraryEndpointTests(TestCase):
    def test_library_returns_sections(self) -> None:
        response = self.client.get(reverse("library"), HTTP_ORIGIN=ORIGIN)
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("sections", payload)
        self.assertGreater(len(payload["sections"]), 0)
        self.assertEqual(response["Access-Control-Allow-Origin"], ORIGIN)

    def test_library_books_endpoint(self) -> None:
        response = self.client.get(reverse("library-books"), HTTP_ORIGIN=ORIGIN)
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("books", payload)
        self.assertGreaterEqual(len(payload["books"]), 1)
        first_book = payload["books"][0]
        self.assertIn("chapters", first_book)
        self.assertGreaterEqual(len(first_book["chapters"]), 1)
        self.assertEqual(response["Access-Control-Allow-Origin"], ORIGIN)

    def test_create_library_book(self) -> None:
        response = self.client.post(
            reverse("library-books"),
            data={"title": "Manual del cronista"},
            content_type="application/json",
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertIn("id", payload)
        self.assertEqual(payload["title"], "Manual del cronista")
        self.assertTrue(Book.objects.filter(id=payload["id"]).exists())
        self.assertEqual(response["Access-Control-Allow-Origin"], ORIGIN)

    def test_update_library_book(self) -> None:
        book = Book.objects.create(id="test-book", title="Borrador", order=99)
        response = self.client.patch(
            reverse("library-book-detail", kwargs={"book_id": book.id}),
            data={"title": "Borrador revisado", "synopsis": "Nueva sinopsis"},
            content_type="application/json",
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["title"], "Borrador revisado")
        book.refresh_from_db()
        self.assertEqual(book.title, "Borrador revisado")
        self.assertEqual(book.synopsis, "Nueva sinopsis")
        self.assertEqual(response["Access-Control-Allow-Origin"], ORIGIN)

    def test_delete_library_book(self) -> None:
        book = Book.objects.create(id="delete-me", title="Libro efímero", order=2)
        Chapter.objects.create(
            id="delete-me-chapter",
            book=book,
            title="Capítulo efímero",
            ordinal=0,
        )

        response = self.client.delete(
            reverse("library-book-detail", kwargs={"book_id": book.id}),
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response["Access-Control-Allow-Origin"], ORIGIN)
        self.assertFalse(Book.objects.filter(id=book.id).exists())
        self.assertFalse(Chapter.objects.filter(book_id=book.id).exists())

    def test_delete_library_book_not_found(self) -> None:
        response = self.client.delete(
            reverse("library-book-detail", kwargs={"book_id": "missing"}),
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response["Access-Control-Allow-Origin"], ORIGIN)


class ChapterEndpointTests(TestCase):
    def test_chapter_detail_endpoint(self) -> None:
        chapter_id = "bk-karamazov-ch-01"
        response = self.client.get(
            reverse("library-chapter-detail", kwargs={"chapter_id": chapter_id}),
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], chapter_id)
        self.assertIn("content", data)
        self.assertTrue(data["content"].strip())
        self.assertIn("paragraphs", data)
        self.assertGreater(len(data["paragraphs"]), 0)
        self.assertIn("blocks", data)
        self.assertGreater(len(data["blocks"]), 0)
        first_block = data["blocks"][0]
        self.assertIn("type", first_block)
        self.assertIn(
            first_block["type"],
            {"paragraph", "dialogue", "scene_boundary", "metadata"},
        )
        self.assertEqual(response["Access-Control-Allow-Origin"], ORIGIN)

    def test_chapter_detail_not_found(self) -> None:
        response = self.client.get(
            reverse("library-chapter-detail", kwargs={"chapter_id": "missing"}),
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response["Access-Control-Allow-Origin"], ORIGIN)

    def test_create_chapter_for_book(self) -> None:
        book = Book.objects.get(pk="bk-karamazov")
        response = self.client.post(
            reverse("library-book-chapters", kwargs={"book_id": book.id}),
            data={"title": "Capítulo inédito", "summary": "Nuevo misterio."},
            content_type="application/json",
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertIn("id", payload)
        self.assertEqual(payload["title"], "Capítulo inédito")
        self.assertTrue(Chapter.objects.filter(id=payload["id"]).exists())
        self.assertEqual(response["Access-Control-Allow-Origin"], ORIGIN)

    def test_update_chapter_metadata(self) -> None:
        chapter = Chapter.objects.get(pk="bk-karamazov-ch-01")
        response = self.client.patch(
            reverse("library-chapter-detail", kwargs={"chapter_id": chapter.id}),
            data={"summary": "Resumen actualizado."},
            content_type="application/json",
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["id"], chapter.id)
        chapter.refresh_from_db()
        self.assertEqual(chapter.summary, "Resumen actualizado.")
        self.assertEqual(response["Access-Control-Allow-Origin"], ORIGIN)

    def test_patch_paragraph_block_updates_text(self) -> None:
        chapter_id = "bk-karamazov-ch-01"
        block_id = "para-ch1-001"
        new_text = "Fyodor contuvo la respiración justo antes de hablar."
        response = self.client.patch(
            reverse(
                "library-chapter-block-update",
                kwargs={"chapter_id": chapter_id, "block_id": block_id},
            ),
            data={"text": new_text},
            content_type="application/json",
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Access-Control-Allow-Origin"], ORIGIN)

        payload = response.json()
        self.assertEqual(payload["id"], chapter_id)
        updated_block = next(block for block in payload["blocks"] if block["id"] == block_id)
        self.assertEqual(updated_block["text"], new_text)
        self.assertIn(new_text, payload["content"])

        editor_response = self.client.get(reverse("editor"), HTTP_ORIGIN=ORIGIN)
        self.assertEqual(editor_response.status_code, 200)
        editor_payload = editor_response.json()
        self.assertIn(new_text, editor_payload["content"])

    def test_patch_block_rejects_mismatched_id(self) -> None:
        chapter_id = "bk-karamazov-ch-01"
        block_id = "para-ch1-002"
        response = self.client.patch(
            reverse(
                "library-chapter-block-update",
                kwargs={"chapter_id": chapter_id, "block_id": block_id},
            ),
            data={"id": "otro-bloque"},
            content_type="application/json",
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(response.status_code, 400)

    def test_patch_block_not_found(self) -> None:
        chapter_id = "bk-karamazov-ch-01"
        response = self.client.patch(
            reverse(
                "library-chapter-block-update",
                kwargs={"chapter_id": chapter_id, "block_id": "missing"},
            ),
            data={"text": "texto"},
            content_type="application/json",
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(response.status_code, 404)

    @patch("studio.views.generate_paragraph_suggestion", return_value="Una sugerencia breve.")
    def test_paragraph_suggestion_endpoint(self, mock_generate) -> None:
        chapter_id = "bk-karamazov-ch-01"
        response = self.client.post(
            reverse("library-chapter-paragraph-suggestion", kwargs={"chapter_id": chapter_id}),
            data={"blockId": "para-ch1-001", "instructions": "Refuerza el suspenso."},
            content_type="application/json",
            HTTP_ORIGIN=ORIGIN,
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("paragraphSuggestion", payload)
        self.assertEqual(payload["paragraphSuggestion"], "Una sugerencia breve.")
        mock_generate.assert_called_once()


class EditorEndpointTests(TestCase):
    def test_editor_returns_blocks(self) -> None:
        response = self.client.get(reverse("editor"), HTTP_ORIGIN=ORIGIN)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("content", data)
        self.assertIn("Fyodor Pavlovich Karamázov", data["content"])
        self.assertIn("paragraphs", data)
        self.assertGreater(len(data["paragraphs"]), 0)
        self.assertIn("blocks", data)
        self.assertGreater(len(data["blocks"]), 0)
        self.assertIn("tokens", data)
        self.assertEqual(response["Access-Control-Allow-Origin"], ORIGIN)


class SchemaEndpointTests(TestCase):
    def test_schema_endpoint_available(self) -> None:
        response = self.client.get(reverse("schema"), HTTP_ORIGIN=ORIGIN)
        self.assertEqual(response.status_code, 200)
        self.assertIn("openapi", response.content.decode())
        self.assertEqual(response["Access-Control-Allow-Origin"], ORIGIN)
