import json

from channels.generic.websocket import AsyncWebsocketConsumer


class EchoConsumer(AsyncWebsocketConsumer):
    async def connect(self) -> None:
        await self.accept()

    async def disconnect(self, close_code: int) -> None:
        pass

    async def receive(self, text_data: str | None = None, bytes_data: bytes | None = None) -> None:
        if text_data is None:
            return
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        # Echo the message back
        await self.send(text_data=json.dumps({
            'message': message
        }))
