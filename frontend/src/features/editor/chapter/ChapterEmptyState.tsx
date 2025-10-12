import { Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";

export function ChapterEmptyState() {
  return (
    <Typography
      variant="body2"
      sx={(theme: Theme) => ({
        ...theme.typography.editorBody,
        color: theme.palette.editor.blockMuted,
      })}
    >
      Sin contenido.
    </Typography>
  );
}
