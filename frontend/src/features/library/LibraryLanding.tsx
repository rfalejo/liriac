import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { useLibraryBooks } from "./useLibraryBooks";
import { useLibrarySections } from "./useLibrarySections";
import { PreviewContainer } from "../preview/PreviewContainer";
import { LibraryBooksPanel } from "./LibraryBooksPanel";
import { LibraryChaptersPanel } from "./LibraryChaptersPanel";
import { LibraryContextPanel } from "./LibraryContextPanel";
import { useLibraryPreview } from "./useLibraryPreview";
import { useLibrarySelection } from "./useLibrarySelection";

export function LibraryLanding() {
  const {
    sections,
    loading: sectionsLoading,
    error: sectionsError,
    reload: reloadSections,
  } = useLibrarySections();
  const {
    books,
    loading: booksLoading,
    error: booksError,
    reload: reloadBooks,
  } = useLibraryBooks();
  const { previewState, openPreview, closePreview } = useLibraryPreview();

  const { refreshLibrary, selectBook, selectedBook, selectedBookId } =
    useLibrarySelection({
      books,
      reloadBooks,
      reloadSections,
    });

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
