from __future__ import annotations

from django.test import TestCase
from django.urls import reverse

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
