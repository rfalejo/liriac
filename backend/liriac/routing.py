"""
WebSocket URL routing for liriac project.
"""

from apps.echo.consumers import EchoConsumer
from django.urls import path

websocket_urlpatterns = [
    path('ws/echo/', EchoConsumer.as_asgi()),
]
