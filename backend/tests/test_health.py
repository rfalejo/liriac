"""Tests for health endpoint."""
import json

from django.test import Client, TestCase


class HealthEndpointTests(TestCase):
    """Test cases for the health check endpoint."""

    def setUp(self):
        self.client = Client()

    def test_health_endpoint_returns_ok(self):
        """Test that the health endpoint returns status 200 with 'ok' status."""
        response = self.client.get('/api/v1/health/')

        self.assertEqual(response.status_code, 200)

        # Parse JSON response
        content = json.loads(response.content.decode())
        self.assertEqual(content['status'], 'ok')

    def test_health_endpoint_content_type(self):
        """Test that the health endpoint returns JSON content type."""
        response = self.client.get('/api/v1/health/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/json')

    def test_health_endpoint_methods(self):
        """Test that only GET method is allowed on health endpoint."""
        # GET should work
        response = self.client.get('/api/v1/health/')
        self.assertEqual(response.status_code, 200)

        # POST should not be allowed
        response = self.client.post('/api/v1/health/')
        self.assertEqual(response.status_code, 405)  # Method Not Allowed
