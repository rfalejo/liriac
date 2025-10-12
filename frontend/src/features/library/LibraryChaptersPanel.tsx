import {
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { LibraryBook } from "../../api/library";

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
  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{ flexBasis: { md: "68%" }, flexGrow: 1, p: 3 }}
    >
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Capítulos
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
            Cargando capítulos
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
            No es posible mostrar capítulos sin datos de libros.
          </Typography>
        </Stack>
      )}
      {!loading && !error && !book && (
        <Stack spacing={1} sx={{ py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Selecciona un libro para previsualizar sus capítulos.
          </Typography>
        </Stack>
      )}
      {!loading && !error && book && (
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
    </Paper>
  );
}
