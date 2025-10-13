from django.urls import path

from .views import (
    ChapterBlockListView,
    ChapterBlockUpdateView,
    ChapterDetailView,
    ChapterParagraphSuggestionView,
    EditorView,
    LibraryBookChaptersView,
    LibraryBookDetailView,
    LibraryBooksView,
    LibraryContextItemsView,
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
        "library/chapters/<str:chapter_id>/blocks/",
        ChapterBlockListView.as_view(),
        name="library-chapter-blocks",
    ),
    path(
        "library/chapters/<str:chapter_id>/blocks/<str:block_id>/",
        ChapterBlockUpdateView.as_view(),
        name="library-chapter-block-update",
    ),
    path(
        "library/chapters/<str:chapter_id>/paragraph-suggestion/",
        ChapterParagraphSuggestionView.as_view(),
        name="library-chapter-paragraph-suggestion",
    ),
    path(
        "library/context/items/",
        LibraryContextItemsView.as_view(),
        name="library-context-items",
    ),
    path("editor/", EditorView.as_view(), name="editor"),
]
