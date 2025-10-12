from django.urls import path

from .views import (
    ChapterBlockUpdateView,
    ChapterDetailView,
    EditorView,
    LibraryBooksView,
    LibraryView,
)

urlpatterns = [
    path("library/", LibraryView.as_view(), name="library"),
    path("library/books/", LibraryBooksView.as_view(), name="library-books"),
    path(
        "library/chapters/<str:chapter_id>/",
        ChapterDetailView.as_view(),
        name="library-chapter-detail",
    ),
    path(
        "library/chapters/<str:chapter_id>/blocks/<str:block_id>/",
        ChapterBlockUpdateView.as_view(),
        name="library-chapter-block-update",
    ),
    path("editor/", EditorView.as_view(), name="editor"),
]
