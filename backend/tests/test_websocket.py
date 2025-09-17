"""Tests for WebSocket echo consumer."""
import pytest
from channels.testing import WebsocketCommunicator

from apps.echo.consumers import EchoConsumer


@pytest.mark.asyncio
class TestEchoConsumer:
    """Test cases for the echo WebSocket consumer."""

    async def test_websocket_connect_and_disconnect(self):
        """Test WebSocket connection and disconnection."""
        communicator = WebsocketCommunicator(EchoConsumer.as_asgi(), "/ws/echo/")

        # Test connection
        connected, subprotocol = await communicator.connect()
        assert connected

        # Test disconnection
        await communicator.disconnect()

    async def test_websocket_echo_message(self):
        """Test that messages are echoed back correctly."""
        communicator = WebsocketCommunicator(EchoConsumer.as_asgi(), "/ws/echo/")

        # Connect
        connected, subprotocol = await communicator.connect()
        assert connected

        # Send a test message
        test_message = {"message": "Hello, WebSocket!"}
        await communicator.send_json_to(test_message)

        # Receive the echoed message
        response = await communicator.receive_json_from()

        # Verify the echo
        assert response["message"] == test_message["message"]

        # Disconnect
        await communicator.disconnect()

    async def test_websocket_multiple_messages(self):
        """Test echoing multiple messages in sequence."""
        communicator = WebsocketCommunicator(EchoConsumer.as_asgi(), "/ws/echo/")

        # Connect
        connected, subprotocol = await communicator.connect()
        assert connected

        # Test multiple messages
        messages = [
            {"message": "First message"},
            {"message": "Second message"},
            {"message": "Third message with special chars: éñ中文"}
        ]

        for test_message in messages:
            await communicator.send_json_to(test_message)
            response = await communicator.receive_json_from()
            assert response["message"] == test_message["message"]

        # Disconnect
        await communicator.disconnect()
