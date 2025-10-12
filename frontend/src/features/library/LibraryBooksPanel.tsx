import {
  Button,
  CircularProgress,
  List,
  ListItemText,
  ListItemButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { LibraryBook } from "../../api/library";

type LibraryBooksPanelProps = {
  books: LibraryBook[];
  loading: boolean;
  error: Error | null;
  selectedBookId: string | null;
  onSelectBook: (bookId: string) => void;
  onReload: () => void;
};

export function LibraryBooksPanel({
  books,
  loading,
  error,
  selectedBookId,
  onSelectBook,
  onReload,
}: LibraryBooksPanelProps) {
  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{ flexBasis: { md: "32%" }, flexGrow: 1, p: 3 }}
    >
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Libros
      </Typography>
      {loading && (
        <Stack
          spacing={2}
          alignItems="center"
          justifyContent="center"
          sx={{ py: 4 }}
        >
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Cargando libros
          </Typography>
        </Stack>
      )}
      {!loading && error && (
        <Stack
          spacing={2}
          alignItems="center"
          textAlign="center"
          sx={{ py: 4 }}
        >
          <Typography variant="body2">
            No se pudieron cargar los libros.
          </Typography>
          <Button variant="contained" size="small" onClick={onReload}>
            Reintentar
          </Button>
        </Stack>
      )}
      {!loading && !error && books.length === 0 && (
        <Stack spacing={1} sx={{ py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Aún no hay libros disponibles.
          </Typography>
        </Stack>
      )}
      {!loading && !error && books.length > 0 && (
        <List disablePadding>
          {books.map((book) => (
            <ListItemButton
              key={book.id}
              selected={book.id === selectedBookId}
              onClick={() => onSelectBook(book.id)}
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
                slotProps={{
                  primary: { variant: "body2", fontWeight: 600 },
                  secondary: {
                    variant: "caption",
                    color: "text.secondary",
                  },
                }}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Paper>
  );
}
