import { CircularProgress, Stack, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";

export function ChapterLoadingState() {
  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      justifyContent="center"
    >
      <CircularProgress size={24} color="inherit" />
      <Typography
        component="span"
        sx={(theme: Theme) => ({
          ...theme.typography.editorBody,
          color: theme.palette.editor.blockMuted,
        })}
      >
        Cargando capítulo...
      </Typography>
    </Stack>
  );
}
