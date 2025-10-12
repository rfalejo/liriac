import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLibraryBooks } from "./useLibraryBooks";
import { useLibrarySections } from "./useLibrarySections";
import { PreviewContainer } from "../preview/PreviewContainer";
import { LibraryBooksPanel } from "./LibraryBooksPanel";
import { LibraryChaptersPanel } from "./LibraryChaptersPanel";
import { LibraryContextPanel } from "./LibraryContextPanel";
import { useLibraryPreview } from "./useLibraryPreview";

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
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const { previewState, openPreview, closePreview } = useLibraryPreview();

  useEffect(() => {
    if (books.length === 0) {
      setSelectedBookId(null);
      return;
    }

    setSelectedBookId((current) => {
      if (current && books.some((book) => book.id === current)) {
        return current;
      }
      return books[0].id;
    });
  }, [books]);

  const selectedBook = useMemo(
    () => books.find((book) => book.id === selectedBookId) ?? null,
    [books, selectedBookId],
  );

  const handleRefresh = useCallback(() => {
    reloadBooks();
    reloadSections();
  }, [reloadBooks, reloadSections]);

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
              onClick={handleRefresh}
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
              onSelectBook={setSelectedBookId}
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
