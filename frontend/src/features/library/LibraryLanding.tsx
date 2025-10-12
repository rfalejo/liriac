import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { PreviewContainer } from "../preview/PreviewContainer";
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
    previewState,
    openPreview,
    closePreview,
  } = useLibraryData();

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
              onOpenChapter={openPreview}
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
      {previewState.chapterId && (
        <PreviewContainer
          open={previewState.open}
          chapterId={previewState.chapterId}
          onClose={closePreview}
        />
      )}
    </Box>
  );
}
