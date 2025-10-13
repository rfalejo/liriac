import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";

export type ChapterHeadingProps = {
  summary: string | null;
  title: string;
};

export function ChapterHeading({ summary, title }: ChapterHeadingProps) {
  return (
    <Stack spacing={1.25} sx={{ mb: 1.75 }}>
      <Typography
        variant="h4"
        sx={(theme: Theme) => ({
          fontFamily: theme.typography.editorBody.fontFamily,
          color: theme.palette.editor.blockHeading,
        })}
      >
        {title}
      </Typography>
      {summary ? (
        <Typography
          variant="subtitle1"
          sx={(theme: Theme) => ({
            fontFamily: theme.typography.editorBody.fontFamily,
            color: theme.palette.editor.blockMuted,
          })}
        >
          {summary}
        </Typography>
      ) : null}
    </Stack>
  );
}
