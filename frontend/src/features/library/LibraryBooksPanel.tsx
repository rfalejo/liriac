import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import type { LibraryBook } from "../../api/library";
import { LibraryPanel } from "./components/LibraryPanel";
import { resolveLibraryPanelStatus } from "./components/panelStatus";
import { AddBookCoverCard, BookCoverCard } from "./components/BookCoverCard";

type LibraryBooksPanelProps = {
  books: LibraryBook[];
  loading: boolean;
  error: Error | null;
  selectedBookId: string | null;
  condensed?: boolean;
  onOpenBook: (bookId: string) => void;
  onReload: () => void;
  onCreateBook: () => void;
  onEditBook: (bookId: string) => void;
  onRefreshLibrary: () => void;
  refreshDisabled?: boolean;
};

export function LibraryBooksPanel({
  books,
  loading,
  error,
  selectedBookId,
  condensed = false,
  onOpenBook,
  onReload,
  onCreateBook,
  onEditBook,
  onRefreshLibrary,
  refreshDisabled = false,
}: LibraryBooksPanelProps) {
  const hasBooks = books.length > 0;
  const loadingStatus = loading && !hasBooks;

  const status = resolveLibraryPanelStatus({
    loading: loadingStatus,
    error,
    isEmpty: false,
    config: {
      loading: { message: "Cargando tu biblioteca", centered: true },
      error: {
        message: "No se pudieron cargar los libros.",
        actionLabel: "Reintentar",
        onAction: onReload,
        centered: true,
      },
    },
  });

  const showContent = !status;

  return (
    <LibraryPanel
      title="Tu biblioteca"
      status={status}
      sx={{ flexGrow: 1 }}
      actions={
        <Tooltip title="Actualizar biblioteca">
          <span>
            <IconButton
              aria-label="Actualizar biblioteca"
              size="small"
              onClick={onRefreshLibrary}
              disabled={refreshDisabled}
              sx={(theme) => ({
                color: theme.palette.text.secondary,
                "&:hover": { color: theme.palette.primary.main },
              })}
            >
              <RefreshRoundedIcon
                fontSize="small"
                sx={{
                  ...(refreshDisabled
                    ? {
                        animation: "spin 900ms linear infinite",
                        "@keyframes spin": {
                          from: { transform: "rotate(0deg)" },
                          to: { transform: "rotate(360deg)" },
                        },
                      }
                    : {}),
                }}
              />
            </IconButton>
          </span>
        </Tooltip>
      }
    >
      {showContent && (
        <Stack spacing={2.5} alignItems="stretch">
          <Typography variant="body2" color="text.secondary">
            {books.length} {books.length === 1 ? "libro" : "libros"}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: { xs: 2, sm: condensed ? 2 : 2.5 },
              gridTemplateColumns: condensed
                ? {
                    xs: "repeat(1, minmax(0, 1fr))",
                    sm: "repeat(1, minmax(0, 1fr))",
                    md: "repeat(1, minmax(0, 1fr))",
                  }
                : {
                    xs: "repeat(1, minmax(0, 1fr))",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(3, minmax(0, 1fr))",
                  },
            }}
          >
            {hasBooks ? (
              books.map((book) => (
                <Box
                  key={book.id}
                  sx={{ height: condensed ? "auto" : "100%" }}
                >
                  <BookCoverCard
                    title={book.title}
                    author={book.author}
                    synopsis={book.synopsis ?? undefined}
                    chaptersCount={book.chapters.length}
                    selected={book.id === selectedBookId}
                    disabled={loading}
                    condensed={condensed}
                    onSelect={() => onOpenBook(book.id)}
                    onEdit={() => onEditBook(book.id)}
                  />
                </Box>
              ))
            ) : (
              <Stack
                spacing={2}
                alignItems="center"
                justifyContent="center"
                sx={{
                  gridColumn: {
                    xs: "1 / -1",
                    sm: condensed ? "1 / -1" : "1 / span 2",
                    md: condensed ? "1 / -1" : "1 / span 3",
                  },
                  textAlign: "center",
                }}
              >
                <Typography variant="body1" fontWeight={600}>
                  Tu biblioteca está vacía
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Crea tu primer libro para comenzar a organizar capítulos.
                </Typography>
              </Stack>
            )}
            <Box sx={{ height: condensed ? "auto" : "100%" }}>
              <AddBookCoverCard
                onClick={onCreateBook}
                disabled={loading}
                label="Nuevo libro"
                condensed={condensed}
              />
            </Box>
          </Box>
        </Stack>
      )}
    </LibraryPanel>
  );
}
