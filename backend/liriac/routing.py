"""
WebSocket URL routing for liriac project.
"""

from django.urls import path

from apps.echo.consumers import EchoConsumer
from apps.suggestions.consumers import SuggestionsConsumer

websocket_urlpatterns = [
    path('ws/echo/', EchoConsumer.as_asgi()),  # type: ignore[arg-type]
    # Start-on-connect suggestions endpoint (client sends start message)
    path('ws/suggestions/', SuggestionsConsumer.as_asgi()),  # type: ignore[arg-type]
]
