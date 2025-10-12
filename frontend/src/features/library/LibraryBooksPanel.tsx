import {
  List,
  ListItemText,
  ListItemButton,
  Paper,
  Typography,
} from "@mui/material";
import type { LibraryBook } from "../../api/library";
import { LibraryPanelStatus } from "./components/LibraryPanelStatus";

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
  const showList = !loading && !error && books.length > 0;

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
        <LibraryPanelStatus
          state="loading"
          message="Cargando libros"
          centered
        />
      )}
      {!loading && error && (
        <LibraryPanelStatus
          state="error"
          message="No se pudieron cargar los libros."
          actionLabel="Reintentar"
          onAction={onReload}
          centered
        />
      )}
      {!loading && !error && books.length === 0 && (
        <LibraryPanelStatus
          state="empty"
          message="Aún no hay libros disponibles."
        />
      )}
      {showList && (
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
