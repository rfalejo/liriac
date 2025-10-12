import { List, ListItemButton, ListItemText, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ChapterSummary } from "../../../api/library";

export type SidebarChapterListProps = {
  activeChapterId: string | null;
  chapters: ChapterSummary[];
  error: Error | null;
  loading: boolean;
  onSelectChapter: (chapterId: string) => void;
};

export function SidebarChapterList({
  activeChapterId,
  chapters,
  error,
  loading,
  onSelectChapter,
}: SidebarChapterListProps) {
  if (loading) {
    return (
      <Typography
        variant="caption"
        sx={(theme: Theme) => ({
          color: theme.palette.editor.sidebarTextMuted,
        })}
      >
        Cargando capítulos...
      </Typography>
    );
  }

  if (error) {
    return (
      <Typography
        variant="caption"
        sx={(theme: Theme) => ({
          color: theme.palette.editor.sidebarErrorText,
        })}
      >
        No se pudo cargar la navegación.
      </Typography>
    );
  }

  if (chapters.length === 0) {
    return (
      <Typography
        variant="caption"
        sx={(theme: Theme) => ({
          color: theme.palette.editor.sidebarTextMuted,
        })}
      >
        No hay capítulos disponibles.
      </Typography>
    );
  }

  return (
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
            transition: "background-color 160ms ease, color 160ms ease",
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
  );
}
