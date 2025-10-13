import {
  Button,
  Divider,
  IconButton,
  List,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import type { LibraryBook } from "../../api/library";
import { LibraryPanel } from "./components/LibraryPanel";
import { resolveLibraryPanelStatus } from "./components/panelStatus";
import { LibraryListItemButton } from "./components/LibraryListItemButton";

type LibraryChaptersPanelProps = {
  book: LibraryBook | null;
  loading: boolean;
  error: Error | null;
  onOpenChapter: (chapterId: string) => void;
  onCreateChapter: (bookId: string) => void;
  onEditChapter: (bookId: string, chapterId: string) => void;
};

export function LibraryChaptersPanel({
  book,
  loading,
  error,
  onOpenChapter,
  onCreateChapter,
  onEditChapter,
}: LibraryChaptersPanelProps) {
  const status = resolveLibraryPanelStatus({
    loading,
    error,
    isEmpty: !book,
    config: {
      loading: { message: "Cargando capítulos", centered: true },
      error: {
        message: "No es posible mostrar capítulos sin datos de libros.",
        centered: true,
      },
      empty: {
        message: "Selecciona un libro para editar sus capítulos.",
      },
    },
  });

  return (
    <LibraryPanel
      title="Capítulos"
      status={status}
      actions={
        book ? (
          <Button
            variant="outlined"
            size="small"
            onClick={() => onCreateChapter(book.id)}
            disabled={loading}
          >
            Nuevo
          </Button>
        ) : undefined
      }
      sx={{ flexBasis: { md: "68%" }, flexGrow: 1 }}
    >
      {book && (
        <Stack spacing={1}>
          <Typography variant="body1" fontWeight={600}>
            {book.title}
          </Typography>
          {book.synopsis && (
            <Typography variant="body2" color="text.secondary">
              {book.synopsis}
            </Typography>
          )}
          <Divider sx={{ my: 2 }} />
          {book.chapters.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Este libro todavía no tiene capítulos.
            </Typography>
          )}
          {book.chapters.length > 0 && (
            <List disablePadding>
              {book.chapters.map((chapter) => (
                <LibraryListItemButton
                  key={chapter.id}
                  variant="stacked"
                  onClick={() => onOpenChapter(chapter.id)}
                >
                  <Stack
                    direction="row"
                    alignItems="flex-start"
                    justifyContent="space-between"
                    spacing={1}
                    sx={{ width: "100%" }}
                  >
                    <ListItemText
                      primary={chapter.title}
                      secondary={chapter.summary ?? undefined}
                      slotProps={{
                        primary: { variant: "body2", fontWeight: 500 },
                        secondary: {
                          variant: "caption",
                          color: "text.secondary",
                        },
                      }}
                    />
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        aria-label="Editar capítulo"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEditChapter(book.id, chapter.id);
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
        </Stack>
      )}
    </LibraryPanel>
  );
}
