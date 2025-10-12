import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { EditorContainer } from "../editor/EditorContainer";
import { LibraryBooksPanel } from "./LibraryBooksPanel";
import { LibraryChaptersPanel } from "./LibraryChaptersPanel";
import { LibraryContextPanel } from "./LibraryContextPanel";
import { useLibraryData } from "./LibraryDataContext";

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
  } = useLibraryData();

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
            />

            <LibraryChaptersPanel
              book={selectedBook}
              loading={booksLoading}
              error={booksError}
              onOpenChapter={openEditor}
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
    </Box>
  );
}
