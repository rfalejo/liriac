import { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { EditorContainer } from "../editor/EditorContainer";
import { LibraryBooksPanel } from "./LibraryBooksPanel";
import { useLibraryData } from "./LibraryDataContext";
import { BookEditorPanel } from "./components/BookEditorPanel";
import { BookDialog } from "./components/BookDialog";
import { ChapterDialog } from "./components/ChapterDialog";
import { LibraryChaptersDialog } from "./LibraryChaptersDialog";

export function LibraryLanding() {
  const {
    books,
    booksLoading,
    booksError,
    reloadBooks,
    sectionsLoading,
    refreshLibrary,
    selectBook,
    selectedBook,
    selectedBookId,
    editorState,
    openEditor,
    closeEditor,
    bookEditor,
    openBookEditor,
    closeBookEditor,
    dialogState,
    openCreateBookDialog,
    openCreateChapterDialog,
    openEditChapterDialog,
    closeDialog,
  } = useLibraryData();

  const [chaptersDialogOpen, setChaptersDialogOpen] = useState(false);

  const handleCloseChapters = useCallback(() => {
    setChaptersDialogOpen(false);
  }, []);

  const isBookDialogOpen = dialogState?.type === "book";
  const isChapterDialogOpen = dialogState?.type === "chapter";

  useEffect(() => {
    if (!bookEditor) {
      return;
    }
    if (!books.some((book) => book.id === bookEditor.bookId)) {
      closeBookEditor();
    }
  }, [bookEditor, books, closeBookEditor]);

  const editingBook = useMemo(
    () =>
      bookEditor
        ? books.find((book) => book.id === bookEditor.bookId) ?? null
        : null,
    [bookEditor, books],
  );

  const editingActive = Boolean(editingBook);

  useEffect(() => {
    if (!editingActive) {
      return;
    }
    setChaptersDialogOpen(false);
  }, [editingActive, setChaptersDialogOpen]);

  const handleOpenBook = useCallback(
    (bookId: string) => {
      if (editingActive) {
        openBookEditor(bookId, { focusTab: "metadata" });
        setChaptersDialogOpen(false);
        return;
      }

      selectBook(bookId);
      setChaptersDialogOpen(true);
    },
    [editingActive, openBookEditor, selectBook, setChaptersDialogOpen],
  );

  const dialogBookForChapter =
    dialogState && dialogState.type === "chapter"
      ? (books.find((book) => book.id === dialogState.bookId) ?? null)
      : null;

  const editingChapter =
    dialogState &&
    dialogState.type === "chapter" &&
    dialogState.mode === "edit" &&
    dialogBookForChapter
      ? (dialogBookForChapter.chapters.find(
          (chapter) => chapter.id === dialogState.chapterId,
        ) ?? null)
      : null;

  if (editorState.open && editorState.chapterId) {
    return (
      <EditorContainer
        open={editorState.open}
        chapterId={editorState.chapterId}
        onClose={closeEditor}
      />
    );
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        backgroundColor: "background.default",
        color: "text.primary",
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 6 } }}>
        <Stack spacing={4} alignItems="stretch">
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 2, md: 3 }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack spacing={0.75}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                Biblioteca
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gestiona tus historias y accede a sus capítulos en un toque.
              </Typography>
            </Stack>
          </Stack>

          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={{ xs: 3, lg: 3.5 }}
            alignItems="stretch"
          >
            <Box
              sx={{
                flexGrow: editingActive ? 0 : 1,
                flexShrink: 0,
                minWidth: 0,
                width: {
                  xs: "100%",
                  lg: editingActive ? 320 : "100%",
                },
                maxWidth: {
                  xs: "100%",
                  lg: editingActive ? 360 : "none",
                },
              }}
            >
              <LibraryBooksPanel
                books={books}
                loading={booksLoading}
                error={booksError}
                selectedBookId={selectedBookId}
                condensed={editingActive}
                onOpenBook={handleOpenBook}
                onReload={reloadBooks}
                onCreateBook={openCreateBookDialog}
                onEditBook={openBookEditor}
                onRefreshLibrary={refreshLibrary}
                refreshDisabled={booksLoading || sectionsLoading}
              />
            </Box>
            {editingBook ? (
              <Box
                sx={{
                  flexGrow: 1,
                  flexShrink: 1,
                  minWidth: 0,
                  width: { xs: "100%", lg: "auto" },
                }}
              >
                <BookEditorPanel
                  book={editingBook}
                  focusTab={bookEditor?.focusTab ?? "metadata"}
                  focusRequest={bookEditor?.requestId ?? 0}
                  onClose={closeBookEditor}
                />
              </Box>
            ) : null}
          </Stack>
        </Stack>
      </Container>

      <BookDialog
        open={isBookDialogOpen}
        onClose={closeDialog}
        onSelectBook={selectBook}
      />

      <ChapterDialog
        open={isChapterDialogOpen}
        mode={dialogState?.type === "chapter" ? dialogState.mode : "create"}
        book={dialogBookForChapter}
        chapter={editingChapter}
        onClose={closeDialog}
        onSelectBook={selectBook}
      />

      <LibraryChaptersDialog
        open={chaptersDialogOpen && Boolean(selectedBook)}
        book={selectedBook}
        loading={booksLoading}
        onClose={handleCloseChapters}
        onOpenChapter={openEditor}
        onCreateChapter={openCreateChapterDialog}
        onEditChapter={openEditChapterDialog}
      />
    </Box>
  );
}
