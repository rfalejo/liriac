import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ContextItem } from "../../api/library";
import { useLibraryBooks } from "./useLibraryBooks";
import { useLibrarySections } from "./useLibrarySections";

function getItemPrimaryText(item: ContextItem) {
  return item.title ?? item.name ?? "Untitled";
}

function getItemSecondaryText(item: ContextItem) {
  return item.summary ?? item.description ?? item.facts ?? undefined;
}

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
    [books, selectedBookId]
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
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Library</Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleRefresh}
              disabled={booksLoading || sectionsLoading}
            >
              Refresh
            </Button>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="stretch">
            <Paper elevation={0} variant="outlined" sx={{ flexBasis: { md: "32%" }, flexGrow: 1, p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Books
              </Typography>
              {booksLoading && (
                <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ py: 4 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Loading books
                  </Typography>
                </Stack>
              )}
              {!booksLoading && booksError && (
                <Stack spacing={2} alignItems="center" textAlign="center" sx={{ py: 4 }}>
                  <Typography variant="body2">Unable to load books.</Typography>
                  <Button variant="contained" size="small" onClick={reloadBooks}>
                    Retry
                  </Button>
                </Stack>
              )}
              {!booksLoading && !booksError && books.length === 0 && (
                <Stack spacing={1} sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No books available yet.
                  </Typography>
                </Stack>
              )}
              {!booksLoading && !booksError && books.length > 0 && (
                <List disablePadding>
                  {books.map((book) => (
                    <ListItemButton
                      key={book.id}
                      selected={book.id === selectedBookId}
                      onClick={() => setSelectedBookId(book.id)}
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        alignItems: "flex-start",
                        "&.Mui-selected": {
                          backgroundColor: "action.selected",
                        },
                        "&.Mui-selected:hover": {
                          backgroundColor: "action.selected",
                        },
                      }}
                    >
                      <ListItemText
                        primary={book.title}
                        secondary={book.author ?? undefined}
                        primaryTypographyProps={{ variant: "body2", fontWeight: 600 }}
                        secondaryTypographyProps={{ variant: "caption", color: "text.secondary" }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </Paper>

            <Paper elevation={0} variant="outlined" sx={{ flexBasis: { md: "68%" }, flexGrow: 1, p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Chapters
              </Typography>
              {booksLoading && (
                <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ py: 4 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Loading chapters
                  </Typography>
                </Stack>
              )}
              {!booksLoading && booksError && (
                <Stack spacing={2} alignItems="center" textAlign="center" sx={{ py: 4 }}>
                  <Typography variant="body2">Cannot show chapters without book data.</Typography>
                </Stack>
              )}
              {!booksLoading && !booksError && !selectedBook && (
                <Stack spacing={1} sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Select a book to preview its chapters.
                  </Typography>
                </Stack>
              )}
              {!booksLoading && !booksError && selectedBook && (
                <Stack spacing={1}>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedBook.title}
                  </Typography>
                  {selectedBook.synopsis && (
                    <Typography variant="body2" color="text.secondary">
                      {selectedBook.synopsis}
                    </Typography>
                  )}
                  <Divider sx={{ my: 2 }} />
                  {selectedBook.chapters.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      This book does not have chapters yet.
                    </Typography>
                  )}
                  {selectedBook.chapters.length > 0 && (
                    <List disablePadding>
                      {selectedBook.chapters.map((chapter, index) => (
                        <ListItem
                          key={chapter.id}
                          disableGutters
                          sx={{
                            flexDirection: "column",
                            alignItems: "flex-start",
                            py: 1,
                            borderBottom:
                              index === selectedBook.chapters.length - 1 ? "none" : "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <ListItemText
                            primary={chapter.title}
                            secondary={chapter.summary ?? undefined}
                            primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                            secondaryTypographyProps={{ variant: "caption", color: "text.secondary" }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Stack>
              )}
            </Paper>
          </Stack>

          <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Context
            </Typography>
            {sectionsLoading && (
              <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ py: 4 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Loading context
                </Typography>
              </Stack>
            )}
            {!sectionsLoading && sectionsError && (
              <Stack spacing={2} alignItems="center" textAlign="center" sx={{ py: 4 }}>
                <Typography variant="body2">Unable to reach context data.</Typography>
                <Button variant="contained" size="small" onClick={reloadSections}>
                  Retry
                </Button>
              </Stack>
            )}
            {!sectionsLoading && !sectionsError && sections.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No context items yet.
              </Typography>
            )}
            {!sectionsLoading && !sectionsError && sections.length > 0 && (
              <Stack spacing={3}>
                {sections.map((section) => (
                  <Stack key={section.id} spacing={1.5}>
                    <Typography variant="body2" fontWeight={600}>
                      {section.title}
                    </Typography>
                    <List disablePadding>
                      {section.items.map((item) => (
                        <ListItem
                          key={item.id}
                          disableGutters
                          sx={{
                            py: 1,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            "&:last-of-type": {
                              borderBottom: "none",
                            },
                          }}
                        >
                          <ListItemText
                            primary={getItemPrimaryText(item)}
                            secondary={getItemSecondaryText(item)}
                            primaryTypographyProps={{ variant: "body2" }}
                            secondaryTypographyProps={{
                              variant: "caption",
                              color: "text.secondary",
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Stack>
                ))}
              </Stack>
            )}
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
