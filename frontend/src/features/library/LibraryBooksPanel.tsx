import { List, ListItemText } from "@mui/material";
import type { LibraryBook } from "../../api/library";
import { LibraryPanel } from "./components/LibraryPanel";
import { resolveLibraryPanelStatus } from "./components/panelStatus";
import { LibraryListItemButton } from "./components/LibraryListItemButton";

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
  const status = resolveLibraryPanelStatus({
    loading,
    error,
    isEmpty: books.length === 0,
    config: {
      loading: { message: "Cargando libros", centered: true },
      error: {
        message: "No se pudieron cargar los libros.",
        actionLabel: "Reintentar",
        onAction: onReload,
        centered: true,
      },
      empty: { message: "Aún no hay libros disponibles." },
    },
  });

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
            <LibraryListItemButton
              key={book.id}
              selected={book.id === selectedBookId}
              onClick={() => onSelectBook(book.id)}
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
            </LibraryListItemButton>
          ))}
        </List>
      )}
    </LibraryPanel>
  );
}
