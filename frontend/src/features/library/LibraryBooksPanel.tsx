import {
  Button,
  IconButton,
  List,
  ListItemText,
  Stack,
  Tooltip,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
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
  onCreateBook: () => void;
  onEditBook: (bookId: string) => void;
};

export function LibraryBooksPanel({
  books,
  loading,
  error,
  selectedBookId,
  onSelectBook,
  onReload,
  onCreateBook,
  onEditBook,
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
      actions={
        <Button
          variant="outlined"
          size="small"
          onClick={onCreateBook}
          disabled={loading}
        >
          Nuevo
        </Button>
      }
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
              <Stack
                direction="row"
                alignItems="flex-start"
                justifyContent="space-between"
                sx={{ width: "100%" }}
                spacing={1}
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
                <Tooltip title="Editar">
                  <IconButton
                    size="small"
                    aria-label="Editar libro"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditBook(book.id);
                    }}
                  >
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </LibraryListItemButton>
          ))}
        </List>
      )}
    </LibraryPanel>
  );
}
