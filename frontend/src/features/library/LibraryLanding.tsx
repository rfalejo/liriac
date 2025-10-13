import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { EditorContainer } from "../editor/EditorContainer";
import { LibraryBooksPanel } from "./LibraryBooksPanel";
import { LibraryChaptersPanel } from "./LibraryChaptersPanel";
import { LibraryContextPanel } from "./LibraryContextPanel";
import { useLibraryData } from "./LibraryDataContext";
import { BookDialog } from "./components/BookDialog";
import { ChapterDialog } from "./components/ChapterDialog";

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
        <Stack spacing={3} alignItems="stretch">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Biblioteca</Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={refreshLibrary}
              disabled={booksLoading || sectionsLoading}
            >
              Actualizar
            </Button>
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            alignItems="stretch"
          >
            <LibraryBooksPanel
              books={books}
              loading={booksLoading}
              error={booksError}
              selectedBookId={selectedBookId}
              onSelectBook={selectBook}
              onReload={reloadBooks}
              onCreateBook={openCreateBookDialog}
              onEditBook={openEditBookDialog}
            />

            <LibraryChaptersPanel
              book={selectedBook}
              loading={booksLoading}
              error={booksError}
              onOpenChapter={openEditor}
              onCreateChapter={openCreateChapterDialog}
              onEditChapter={openEditChapterDialog}
            />
          </Stack>

          <LibraryContextPanel
            sections={sections}
            loading={sectionsLoading}
            error={sectionsError}
            onReload={reloadSections}
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
    </Box>
  );
}
