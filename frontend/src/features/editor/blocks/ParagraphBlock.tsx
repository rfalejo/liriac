import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import type { components } from "../../../api/schema";
import type {
  ParagraphEditingState,
  ParagraphSuggestionState,
} from "../types";
import { EditableBlock } from "./components/EditableBlock";
import { EditableContentField } from "./components/EditableContentField";
import {
  createBlockEditingSelector,
  createEditingShortcutHandler,
} from "./utils/blockEditingHelpers";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type ParagraphBlockProps = {
  block: ChapterBlock;
};

export function ParagraphBlock({ block }: ParagraphBlockProps) {
  return (
    <EditableBlock<ParagraphEditingState>
      block={block}
      selectEditingState={createBlockEditingSelector("paragraph")}
      renderReadView={(currentBlock) => {
        const content = currentBlock.text?.trim() ?? "";
        return (
          <Typography
            component="p"
            sx={(theme: Theme) => theme.typography.editorParagraph}
          >
            {content.length > 0 ? content : "(Sin texto en este párrafo)"}
          </Typography>
        );
      }}
      renderEditView={(currentBlock, editing) => (
        <ParagraphEditView blockId={currentBlock.id} editingState={editing} />
      )}
    />
  );
}

type ParagraphEditViewProps = {
  blockId: string;
  editingState: ParagraphEditingState;
};

function ParagraphEditView({ blockId, editingState }: ParagraphEditViewProps) {
  const draftText = editingState.paragraph.draftText;
  const suggestion = editingState.paragraph.suggestion;

  const handleKeyDown =
    createEditingShortcutHandler<HTMLDivElement>(editingState);

  return (
    <Stack spacing={1.75} alignItems="stretch">
      <EditableContentField
        value={draftText}
        onChange={editingState.paragraph.onChangeDraft}
        ariaLabel="Editor de párrafo"
        placeholder="Añade texto para este párrafo"
        multiline
        autoFocus
        focusKey={blockId}
        selectionBehavior="caret-at-end"
        onKeyDown={handleKeyDown}
        spellCheck
        sx={(theme: Theme) => theme.typography.editorParagraphEditable}
      />
      {suggestion?.result ? (
        <ParagraphSuggestionPreview suggestion={suggestion} />
      ) : null}
      {suggestion ? (
        <ParagraphSuggestionPrompt blockId={blockId} suggestion={suggestion} />
      ) : null}
    </Stack>
  );
}

type ParagraphSuggestionPromptProps = {
  blockId: string;
  suggestion: ParagraphSuggestionState;
};

function ParagraphSuggestionPrompt({
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
            disabled={suggestion.isRequesting || trimmedInstructions.length === 0}
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

type ParagraphSuggestionPreviewProps = {
  suggestion: ParagraphSuggestionState;
};

function ParagraphSuggestionPreview({
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
