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
