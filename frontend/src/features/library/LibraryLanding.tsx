import { useCallback, useState } from "react";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { EditorContainer } from "../editor/EditorContainer";
import { LibraryBooksPanel } from "./LibraryBooksPanel";
import { useLibraryData } from "./LibraryDataContext";
import { BookDialog } from "./components/BookDialog";
import { ChapterDialog } from "./components/ChapterDialog";
import { LibraryChaptersDialog } from "./LibraryChaptersDialog";
import { LibraryContextDialog } from "./LibraryContextDialog";

export function LibraryLanding() {
  const {
    books,
    booksLoading,
    booksError,
    reloadBooks,
    sections,
    sectionsLoading,
    sectionsError,
    reloadSections,
    refreshLibrary,
    selectBook,
    selectedBook,
    selectedBookId,
    editorState,
    openEditor,
    closeEditor,
    dialogState,
    openCreateBookDialog,
    openEditBookDialog,
    openCreateChapterDialog,
    openEditChapterDialog,
    closeDialog,
  } = useLibraryData();

  const [chaptersDialogOpen, setChaptersDialogOpen] = useState(false);
  const [contextDialogOpen, setContextDialogOpen] = useState(false);

  const handleOpenBook = useCallback(
    (bookId: string) => {
      selectBook(bookId);
      setChaptersDialogOpen(true);
    },
    [selectBook],
  );

  const handleCloseChapters = useCallback(() => {
    setChaptersDialogOpen(false);
  }, []);

  const handleOpenContext = useCallback(() => {
    setContextDialogOpen(true);
  }, []);

  const handleCloseContext = useCallback(() => {
    setContextDialogOpen(false);
  }, []);

  const isBookDialogOpen = dialogState?.type === "book";
  const isChapterDialogOpen = dialogState?.type === "chapter";

  const editingBook =
    dialogState && dialogState.type === "book" && dialogState.mode === "edit"
      ? (books.find((book) => book.id === dialogState.bookId) ?? null)
      : null;

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
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="text"
                onClick={handleOpenContext}
                disabled={sectionsLoading}
              >
                Ver contexto
              </Button>
              <Button
                variant="outlined"
                onClick={refreshLibrary}
                disabled={booksLoading || sectionsLoading}
              >
                Actualizar
              </Button>
            </Stack>
          </Stack>

          <LibraryBooksPanel
            books={books}
            loading={booksLoading}
            error={booksError}
            selectedBookId={selectedBookId}
            onOpenBook={handleOpenBook}
            onReload={reloadBooks}
            onCreateBook={openCreateBookDialog}
            onEditBook={openEditBookDialog}
          />
        </Stack>
      </Container>

      <BookDialog
        open={isBookDialogOpen}
        mode={dialogState?.type === "book" ? dialogState.mode : "create"}
        book={editingBook}
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

      <LibraryContextDialog
        open={contextDialogOpen}
        sections={sections}
        loading={sectionsLoading}
        error={sectionsError}
        onReload={reloadSections}
        onClose={handleCloseContext}
      />
    </Box>
  );
}
