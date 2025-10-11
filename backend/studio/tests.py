from django.test import TestCase
from django.urls import reverse


ORIGIN = "http://localhost:5173"


class LibraryEndpointTests(TestCase):
    def test_library_returns_sections(self) -> None:
        response = self.client.get(reverse("library"), HTTP_ORIGIN=ORIGIN)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("sections", data)
        self.assertGreater(len(data["sections"]), 0)
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

    def test_chapter_detail_endpoint(self) -> None:
        chapter_id = "ch-03"
        response = self.client.get(
            reverse("library-chapter-detail", kwargs={"chapter_id": chapter_id}),
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], chapter_id)
        self.assertIn("content", data)
        self.assertTrue(data["content"])
        self.assertEqual(response["Access-Control-Allow-Origin"], ORIGIN)

    def test_chapter_detail_not_found(self) -> None:
        response = self.client.get(
            reverse("library-chapter-detail", kwargs={"chapter_id": "missing"}),
            HTTP_ORIGIN=ORIGIN,
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response["Access-Control-Allow-Origin"], ORIGIN)


class EditorEndpointTests(TestCase):
    def test_editor_returns_content(self) -> None:
        response = self.client.get(reverse("editor"), HTTP_ORIGIN=ORIGIN)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("content", data)
        self.assertTrue(data["content"].startswith("The pier"))
        self.assertIn("tokens", data)
        self.assertEqual(response["Access-Control-Allow-Origin"], ORIGIN)


class SchemaTests(TestCase):
    def test_schema_endpoint_available(self) -> None:
        response = self.client.get(reverse("schema"), HTTP_ORIGIN=ORIGIN)
        self.assertEqual(response.status_code, 200)
        self.assertIn("openapi", response.content.decode())
        self.assertEqual(response["Access-Control-Allow-Origin"], ORIGIN)
