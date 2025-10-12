from django.urls import path

from .views import (
    ChapterBlockUpdateView,
    ChapterDetailView,
    EditorView,
    LibraryBookChaptersView,
    LibraryBookDetailView,
    LibraryBooksView,
    LibraryView,
)

urlpatterns = [
    path("library/", LibraryView.as_view(), name="library"),
    path("library/books/", LibraryBooksView.as_view(), name="library-books"),
    path(
        "library/books/<str:book_id>/",
        LibraryBookDetailView.as_view(),
        name="library-book-detail",
    ),
    path(
        "library/books/<str:book_id>/chapters/",
        LibraryBookChaptersView.as_view(),
        name="library-book-chapters",
    ),
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
