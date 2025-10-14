import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import type { ParagraphSuggestionState } from "../../types";
import { EditableContentField } from "../components/EditableContentField";

type ParagraphSuggestionPromptProps = {
  blockId: string;
  suggestion: ParagraphSuggestionState;
};

export function ParagraphSuggestionPrompt({
  blockId,
  suggestion,
}: ParagraphSuggestionPromptProps) {
  if (!suggestion.promptOpen) {
    return null;
  }

  const instructionsId = `paragraph-suggestion-${blockId}`;
  const errorId = `${instructionsId}-error`;
  const hasError = Boolean(suggestion.error);
  const trimmedInstructions = suggestion.instructions.trim();
  const isCopyingPrompt = suggestion.isCopyingPrompt;
  const isCopied = suggestion.copyStatus === "copied";
  const copyButtonDisabled =
    suggestion.isRequesting ||
    isCopyingPrompt ||
    trimmedInstructions.length === 0;

  return (
    <Box
      sx={(theme: Theme) => ({
        borderRadius: theme.editor.blockRadius,
        backgroundColor: theme.palette.editor.suggestionPromptBg,
        border: `1px solid ${theme.palette.editor.suggestionPromptBorder}`,
        boxShadow: theme.palette.editor.suggestionPromptShadow,
        px: 2,
        py: 1.75,
      })}
    >
      <Stack spacing={1.25} alignItems="stretch">
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
        <EditableContentField
          value={suggestion.instructions}
          onChange={suggestion.onChangeInstructions}
          ariaLabel="Instrucciones para la sugerencia"
          ariaDescribedBy={hasError ? errorId : undefined}
          placeholder="Describe qué necesitas que sugiera la IA"
          multiline
          autoFocus
          focusKey={instructionsId}
          selectionBehavior="select-all"
          spellCheck
          sx={(theme: Theme) => ({
            ...theme.typography.editorBody,
            ...theme.editor.blocks.interactiveField,
            backgroundColor: theme.palette.editor.blockSurface,
          })}
        />
        {hasError ? (
          <Typography
            variant="body2"
            id={errorId}
            sx={(theme: Theme) => ({
              color: theme.palette.editor.suggestionErrorText,
            })}
          >
            {suggestion.error}
          </Typography>
        ) : null}
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            variant={isCopied ? "contained" : "outlined"}
            color={isCopied ? "success" : "inherit"}
            onClick={() => {
              void suggestion.onCopyPrompt();
            }}
            disabled={copyButtonDisabled}
            endIcon={
              isCopyingPrompt ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
            sx={(theme: Theme) =>
              isCopied
                ? {
                    backgroundColor: theme.palette.success.main,
                    color: theme.palette.success.contrastText,
                    borderColor: theme.palette.success.main,
                    "&:hover": {
                      backgroundColor: theme.palette.success.dark,
                      borderColor: theme.palette.success.dark,
                    },
                  }
                : {
                    borderColor: theme.palette.editor.suggestionPromptBorder,
                    color: theme.palette.editor.blockMuted,
                    "&:hover": {
                      borderColor: theme.palette.editor.blockMuted,
                      backgroundColor: theme.palette.editor.suggestionPromptBg,
                    },
                  }}
          >
            {isCopied ? "Copiado" : "Copiar"}
          </Button>
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
    </Box>
  );
}
