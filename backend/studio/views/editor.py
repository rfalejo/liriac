from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from ..data import get_editor_state
from ..serializers import EditorStateSerializer

__all__ = ["EditorView"]


class EditorView(APIView):
    """Return the current editor snapshot."""

    authentication_classes: list = []
    permission_classes: list = []

    @extend_schema(responses=EditorStateSerializer)
    def get(self, _request):
        editor_state = get_editor_state()
        serializer = EditorStateSerializer(editor_state)
        return Response(serializer.data)
