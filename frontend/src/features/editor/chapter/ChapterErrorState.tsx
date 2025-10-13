import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";

export type ChapterErrorStateProps = {
  onRetry: () => void;
};

export function ChapterErrorState({ onRetry }: ChapterErrorStateProps) {
  return (
    <Stack spacing={2} alignItems="center" textAlign="center">
      <Typography
        sx={(theme: Theme) => ({
          ...theme.typography.editorBody,
          color: theme.palette.error.main,
        })}
      >
        No se pudo cargar el capítulo.
      </Typography>
      <Button variant="outlined" onClick={onRetry}>
        Reintentar
      </Button>
    </Stack>
  );
}
