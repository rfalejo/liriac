import { List, ListItemText, ListItemButton } from "@mui/material";
import type { LibraryBook } from "../../api/library";
import { LibraryPanel } from "./components/LibraryPanel";
import type { LibraryPanelStatusProps } from "./components/LibraryPanelStatus";

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
  const status: LibraryPanelStatusProps | null = (() => {
    if (loading) {
      return { state: "loading", message: "Cargando libros", centered: true };
    }

    if (error) {
      return {
        state: "error",
        message: "No se pudieron cargar los libros.",
        actionLabel: "Reintentar",
        onAction: onReload,
        centered: true,
      };
    }

    if (books.length === 0) {
      return { state: "empty", message: "Aún no hay libros disponibles." };
    }

    return null;
  })();

  const showList = !status;

  return (
    <LibraryPanel
      title="Libros"
      status={status}
      sx={{ flexBasis: { md: "32%" }, flexGrow: 1 }}
    >
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
    </LibraryPanel>
  );
}
