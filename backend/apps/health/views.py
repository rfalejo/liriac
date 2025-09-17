from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def health_check(request):  # type: ignore[no-untyped-def]
    """Health check endpoint."""
    return Response({"status": "ok"})
