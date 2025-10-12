import { Divider, List, ListItemText, Stack, Typography } from "@mui/material";
import type { LibraryBook } from "../../api/library";
import { LibraryPanel } from "./components/LibraryPanel";
import { resolveLibraryPanelStatus } from "./components/panelStatus";
import { LibraryListItemButton } from "./components/LibraryListItemButton";

type LibraryChaptersPanelProps = {
  book: LibraryBook | null;
  loading: boolean;
  error: Error | null;
  onOpenChapter: (chapterId: string) => void;
};

export function LibraryChaptersPanel({
  book,
  loading,
  error,
  onOpenChapter,
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
                </LibraryListItemButton>
              ))}
            </List>
          )}
        </Stack>
      )}
    </LibraryPanel>
  );
}
