import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import type { ParagraphSuggestionState } from "../../types";

type ParagraphSuggestionPreviewProps = {
  suggestion: ParagraphSuggestionState;
};

export function ParagraphSuggestionPreview({
  suggestion,
}: ParagraphSuggestionPreviewProps) {
  const result = suggestion.result;

  if (!result) {
    return null;
  }

  return (
    <Box
      sx={(theme: Theme) => ({
        borderRadius: theme.editor.blockRadius,
        backgroundColor: theme.palette.editor.suggestionHighlightBg,
        border: `1px solid ${theme.palette.editor.suggestionHighlightBorder}`,
        px: 2,
        py: 1.75,
        color: theme.palette.editor.suggestionHighlightText,
      })}
    >
      <Stack spacing={1.25} alignItems="stretch">
        <Typography
          variant="overline"
          sx={(theme: Theme) => ({
            fontFamily: theme.typography.editorBody.fontFamily,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: theme.palette.editor.blockMuted,
            opacity: 0.9,
          })}
        >
          Sugerencia
        </Typography>
        <Typography
          component="div"
          sx={(theme: Theme) => ({
            ...theme.typography.editorParagraph,
            color: theme.palette.editor.suggestionHighlightText,
            whiteSpace: "pre-wrap",
          })}
        >
          {result.text}
        </Typography>
        <Typography
          variant="caption"
          sx={(theme: Theme) => ({
            color: theme.palette.editor.blockMuted,
            fontStyle: "italic",
          })}
        >
          Con instrucciones: "{result.instructions}".
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              result.onApply();
            }}
          >
            Aplicar sugerencia
          </Button>
          <Button
            variant="text"
            color="secondary"
            onClick={() => {
              result.onDismiss();
            }}
          >
            Descartar
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
