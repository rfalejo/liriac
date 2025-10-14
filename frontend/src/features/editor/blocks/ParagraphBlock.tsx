import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import type { components } from "../../../api/schema";
import type {
  ParagraphEditingState,
} from "../types";
import { EditableBlock } from "./components/EditableBlock";
import { EditableContentField } from "./components/EditableContentField";
import {
  createBlockEditingSelector,
  createEditingShortcutHandler,
} from "./utils/blockEditingHelpers";
import { ParagraphSuggestionPreview } from "./suggestions/ParagraphSuggestionPreview";
import { ParagraphSuggestionPrompt } from "./suggestions/ParagraphSuggestionPrompt";
import { ParagraphSuggestionInlineControls } from "./suggestions/ParagraphSuggestionInlineControls";

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
  const usesDraftAsPrompt = suggestion?.usesDraftAsPrompt ?? false;

  const handleKeyDown =
    createEditingShortcutHandler<HTMLDivElement>(editingState);

  const placeholder = usesDraftAsPrompt
    ? "Describe qué necesitas que sugiera la IA"
    : "Añade texto para este párrafo";

  const ariaLabel = usesDraftAsPrompt
    ? "Instrucciones para la sugerencia"
    : "Editor de párrafo";

  return (
    <Stack spacing={1.75} alignItems="stretch">
      <EditableContentField
        value={draftText}
        onChange={editingState.paragraph.onChangeDraft}
        ariaLabel={ariaLabel}
        placeholder={placeholder}
        multiline
        autoFocus
        focusKey={blockId}
        selectionBehavior="caret-at-end"
        onKeyDown={handleKeyDown}
        spellCheck
        sx={(theme: Theme) => (
          usesDraftAsPrompt
            ? {
                ...theme.typography.editorBody,
                ...theme.editor.blocks.interactiveField,
                backgroundColor: theme.palette.editor.suggestionPromptBg,
                borderRadius: theme.editor.blockRadius,
                border: `1px solid ${theme.palette.editor.suggestionPromptBorder}`,
                boxShadow: theme.palette.editor.suggestionPromptShadow,
                padding: theme.spacing(1.25, 5, 1.25, 1.5),
                minHeight: theme.spacing(9),
              }
            : theme.typography.editorParagraphEditable
        )}
      />
      {suggestion?.result ? (
        <ParagraphSuggestionPreview suggestion={suggestion} />
      ) : null}
      {suggestion ? (
        suggestion.usesDraftAsPrompt ? (
          <ParagraphSuggestionInlineControls suggestion={suggestion} />
        ) : (
          <ParagraphSuggestionPrompt blockId={blockId} suggestion={suggestion} />
        )
      ) : null}
    </Stack>
  );
}
