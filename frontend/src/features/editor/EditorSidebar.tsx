import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ChapterSummary } from "../../api/library";

type EditorSidebarProps = {
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

export function EditorSidebar({
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
}: EditorSidebarProps) {
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
          sx={(theme: Theme) => ({
            width: "100%",
            height: "100%",
            px: 3,
            py: 3,
            bgcolor: theme.palette.editor.sidebarBg,
            borderRight: `1px solid ${theme.palette.editor.sidebarBorder}`,
            backdropFilter: "blur(14px)",
            color: theme.palette.editor.sidebarTextPrimary,
            transform: visible ? "translateX(0)" : "translateX(-32px)",
            opacity: visible ? 1 : 0,
            transition: "opacity 180ms ease, transform 240ms ease",
          })}
        >
          <Typography
            id="editor-container-heading"
            variant="subtitle2"
            sx={(theme: Theme) => ({
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: theme.palette.editor.sidebarHeading,
            })}
          >
            {bookTitle ?? "Capítulos"}
          </Typography>
          <Button
            variant="text"
            color="inherit"
            onClick={onClose}
            sx={(theme: Theme) => ({
              alignSelf: "flex-start",
              color: theme.palette.editor.sidebarButton,
              px: 0,
              "&:hover": {
                color: theme.palette.editor.sidebarButtonHover,
                backgroundColor: "transparent",
              },
            })}
          >
            Regresar a la librería
          </Button>
          <Box sx={{ flex: 1, overflowY: "auto", pr: 1 }}>
            {loading ? (
              <Typography
                variant="caption"
                sx={(theme: Theme) => ({
                  color: theme.palette.editor.sidebarTextMuted,
                })}
              >
                Cargando capítulos...
              </Typography>
            ) : error ? (
              <Typography
                variant="caption"
                sx={(theme: Theme) => ({
                  color: theme.palette.editor.sidebarErrorText,
                })}
              >
                No se pudo cargar la navegación.
              </Typography>
            ) : chapters.length === 0 ? (
              <Typography
                variant="caption"
                sx={(theme: Theme) => ({
                  color: theme.palette.editor.sidebarTextMuted,
                })}
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
                    sx={(theme: Theme) => ({
                      alignItems: "flex-start",
                      borderRadius: 1,
                      mb: 0.5,
                      color: theme.palette.editor.sidebarTextPrimary,
                      transition:
                        "background-color 160ms ease, color 160ms ease",
                      "&.Mui-selected": {
                        bgcolor: theme.palette.editor.sidebarSelectedBg,
                        color: theme.palette.editor.sidebarSelectedText,
                      },
                      "&:hover": {
                        bgcolor: theme.palette.editor.sidebarHoverBg,
                      },
                    })}
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
                          noWrap: true,
                          sx: (theme: Theme) => ({
                            color: theme.palette.editor.sidebarTextMuted,
                          }),
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
