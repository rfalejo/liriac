from django.urls import path

from .views import EditorView, LibraryView

urlpatterns = [
    path("library/", LibraryView.as_view(), name="library"),
    path("editor/", EditorView.as_view(), name="editor"),
]
