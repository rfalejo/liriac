import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import type { ParagraphSuggestionState } from "../../types";

type ParagraphSuggestionInlineControlsProps = {
  suggestion: ParagraphSuggestionState;
};

export function ParagraphSuggestionInlineControls({
  suggestion,
}: ParagraphSuggestionInlineControlsProps) {
  if (!suggestion.promptOpen || !suggestion.usesDraftAsPrompt) {
    return null;
  }

  const trimmedInstructions = suggestion.instructions.trim();

  return (
    <Stack spacing={1} alignItems="flex-start">
      <Typography
        variant="subtitle2"
        sx={(theme: Theme) => ({
          fontFamily: theme.typography.editorBody.fontFamily,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: theme.palette.editor.blockMuted,
        })}
      >
        Pedir ayuda creativa
      </Typography>
      {suggestion.error ? (
        <Typography
          variant="body2"
          sx={(theme: Theme) => ({
            color: theme.palette.editor.suggestionErrorText,
          })}
        >
          {suggestion.error}
        </Typography>
      ) : null}
      <Stack direction="row" spacing={1} justifyContent="flex-end" width="100%">
        <Button
          variant="text"
          color="secondary"
          onClick={() => {
            suggestion.onClosePrompt();
          }}
          disabled={suggestion.isRequesting}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            void suggestion.onSubmit();
          }}
          disabled={
            suggestion.isRequesting || trimmedInstructions.length === 0
          }
          endIcon={
            suggestion.isRequesting ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          Generar
        </Button>
      </Stack>
    </Stack>
  );
}
