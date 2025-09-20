from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BookChapterListCreateAPIView,
    BookChaptersReorderAPIView,
    BookViewSet,
    ChapterAutosaveAPIView,
    ChapterViewSet,
    PersonaViewSet,
)

router = DefaultRouter()
router.register(r"books", BookViewSet, basename="book")
router.register(r"chapters", ChapterViewSet, basename="chapter")
router.register(r"personas", PersonaViewSet, basename="persona")

urlpatterns = [
    path("", include(router.urls)),
    path("books/<int:book_pk>/chapters/", BookChapterListCreateAPIView.as_view(), name="book-chapters"),
    path(
        "books/<int:book_pk>/chapters/reorder/",
        BookChaptersReorderAPIView.as_view(),
        name="book-chapters-reorder",
    ),
    path("chapters/<int:id>/autosave/", ChapterAutosaveAPIView.as_view(), name="chapter-autosave"),
]
