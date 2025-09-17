from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view
from rest_framework.response import Response


@extend_schema(
    responses={
        200: {
            "type": "object",
            "properties": {
                "status": {"type": "string"},
            },
            "required": ["status"],
        }
    }
)
@api_view(['GET'])
def health_check(request):  # type: ignore[no-untyped-def]
    """Health check endpoint."""
    return Response({"status": "ok"})
