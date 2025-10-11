import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import type { ChapterSummary } from "../../api/library";

type PreviewSidebarProps = {
  activeChapterId: string | null;
  bookTitle: string | null;
  chapters: ChapterSummary[];
  error: Error | null;
  loading: boolean;
  onClose: () => void;
  onEnter: () => void;
  onLeave: () => void;
  onSelectChapter: (chapterId: string) => void;
  visible: boolean;
};

export function PreviewSidebar({
  activeChapterId,
  bookTitle,
  chapters,
  error,
  loading,
  onClose,
  onEnter,
  onLeave,
  onSelectChapter,
  visible,
}: PreviewSidebarProps) {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        display: "flex",
        alignItems: "stretch",
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      <Box
        role="presentation"
        tabIndex={0}
        aria-label="Mostrar navegación del libro"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocus={onEnter}
        onBlur={onLeave}
        sx={{
          width: 28,
          height: "100%",
          pointerEvents: "auto",
          outline: "none",
        }}
      />
      <Box
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocusCapture={onEnter}
        onBlurCapture={onLeave}
        sx={{
          width: 280,
          height: "100%",
          pointerEvents: visible ? "auto" : "none",
          display: "flex",
        }}
      >
        <Stack
          spacing={2.5}
          sx={{
            width: "100%",
            height: "100%",
            px: 3,
            py: 3,
            bgcolor: "rgba(10, 12, 16, 0.68)",
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(14px)",
            color: "rgba(255, 255, 255, 0.82)",
            transform: visible ? "translateX(0)" : "translateX(-32px)",
            opacity: visible ? 1 : 0,
            transition: "opacity 180ms ease, transform 240ms ease",
          }}
        >
          <Typography
            id="preview-container-heading"
            variant="subtitle2"
            sx={{
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(255, 255, 255, 0.65)",
            }}
          >
            {bookTitle ?? "Capítulos"}
          </Typography>
          <Button
            variant="text"
            color="inherit"
            onClick={onClose}
            sx={{
              alignSelf: "flex-start",
              color: "rgba(255, 255, 255, 0.74)",
              px: 0,
              "&:hover": {
                color: "rgba(255, 255, 255, 0.92)",
                backgroundColor: "transparent",
              },
            }}
          >
            Regresar a la librería
          </Button>
          <Box sx={{ flex: 1, overflowY: "auto", pr: 1 }}>
            {loading ? (
              <Typography
                variant="caption"
                sx={{ color: "rgba(255, 255, 255, 0.6)" }}
              >
                Cargando capítulos...
              </Typography>
            ) : error ? (
              <Typography
                variant="caption"
                sx={{ color: "rgba(255, 128, 128, 0.85)" }}
              >
                No se pudo cargar la navegación.
              </Typography>
            ) : chapters.length === 0 ? (
              <Typography
                variant="caption"
                sx={{ color: "rgba(255, 255, 255, 0.6)" }}
              >
                No hay capítulos disponibles.
              </Typography>
            ) : (
              <List dense disablePadding>
                {chapters.map((chapterOption) => (
                  <ListItemButton
                    key={chapterOption.id}
                    selected={chapterOption.id === activeChapterId}
                    onClick={() => onSelectChapter(chapterOption.id)}
                    sx={{
                      alignItems: "flex-start",
                      borderRadius: 1,
                      mb: 0.5,
                      color: "rgba(255, 255, 255, 0.78)",
                      transition:
                        "background-color 160ms ease, color 160ms ease",
                      "&.Mui-selected": {
                        bgcolor: "rgba(255, 255, 255, 0.16)",
                        color: "rgba(255, 255, 255, 0.95)",
                      },
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 0.12)",
                      },
                    }}
                  >
                    <ListItemText
                      primary={chapterOption.title}
                      secondary={chapterOption.summary || undefined}
                      slotProps={{
                        primary: {
                          variant: "body2",
                          noWrap: true,
                        },
                        secondary: {
                          variant: "caption",
                          color: "rgba(255, 255, 255, 0.62)",
                          noWrap: true,
                        },
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
