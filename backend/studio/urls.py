from django.urls import path

from .views import ChapterDetailView, EditorView, LibraryBooksView, LibraryView

urlpatterns = [
    path("library/", LibraryView.as_view(), name="library"),
    path("library/books/", LibraryBooksView.as_view(), name="library-books"),
    path(
        "library/chapters/<str:chapter_id>/",
        ChapterDetailView.as_view(),
        name="library-chapter-detail",
    ),
    path("editor/", EditorView.as_view(), name="editor"),
]
