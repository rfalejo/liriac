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
