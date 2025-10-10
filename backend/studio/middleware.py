from __future__ import annotations

from typing import Callable

from django.http import HttpRequest, HttpResponse


class LocalCorsMiddleware:
    """Allow local frontend to access the Django API without CORS errors."""

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        if request.method == "OPTIONS":
            response = HttpResponse(status=204)
        else:
            response = self.get_response(request)

        origin = request.headers.get("Origin")
        allow_origin = origin or "*"

        response["Access-Control-Allow-Origin"] = allow_origin
        response["Vary"] = (response.get("Vary", "") + ", Origin").strip(", ")
        response.setdefault(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        )
        response.setdefault("Access-Control-Allow-Headers", "Content-Type, Authorization")
        response.setdefault("Access-Control-Allow-Credentials", "true")
        response.setdefault("Access-Control-Max-Age", "86400")

        return response
