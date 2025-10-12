import { Divider, List, ListItemButton, ListItemText, Stack, Typography } from "@mui/material";
import type { LibraryBook } from "../../api/library";
import { LibraryPanel } from "./components/LibraryPanel";
import type { LibraryPanelStatusProps } from "./components/LibraryPanelStatus";

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
  const status: LibraryPanelStatusProps | null = (() => {
    if (loading) {
      return {
        state: "loading",
        message: "Cargando capítulos",
        centered: true,
      };
    }

    if (error) {
      return {
        state: "error",
        message: "No es posible mostrar capítulos sin datos de libros.",
        centered: true,
      };
    }

    if (!book) {
      return {
        state: "empty",
        message: "Selecciona un libro para editar sus capítulos.",
      };
    }

    return null;
  })();

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
                <ListItemButton
                  key={chapter.id}
                  onClick={() => onOpenChapter(chapter.id)}
                  sx={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 0.5,
                    px: 2,
                    py: 1.5,
                    borderRadius: 2,
                    mb: 1,
                    textAlign: "left",
                    backgroundColor: "transparent",
                    "&:last-of-type": {
                      mb: 0,
                    },
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
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
                </ListItemButton>
              ))}
            </List>
          )}
        </Stack>
      )}
    </LibraryPanel>
  );
}
