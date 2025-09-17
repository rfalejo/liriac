"""
WebSocket URL routing for liriac project.
"""

from django.urls import path

from apps.echo.consumers import EchoConsumer

websocket_urlpatterns = [
    path('ws/echo/', EchoConsumer.as_asgi()),
]
