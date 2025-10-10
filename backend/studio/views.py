from __future__ import annotations

from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .data import EDITOR_STATE, LIBRARY_SECTIONS
from .serializers import EditorStateSerializer, LibraryResponseSerializer


class LibraryView(APIView):
	"""Return the available context sections for the local library."""

	authentication_classes: list = []
	permission_classes: list = []

	@extend_schema(responses=LibraryResponseSerializer)
	def get(self, _request):
		serializer = LibraryResponseSerializer({"sections": LIBRARY_SECTIONS})
		return Response(serializer.data)


class EditorView(APIView):
	"""Return the current editor snapshot."""

	authentication_classes: list = []
	permission_classes: list = []

	@extend_schema(responses=EditorStateSerializer)
	def get(self, _request):
		serializer = EditorStateSerializer(EDITOR_STATE)
		return Response(serializer.data)
