import { Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { KeyboardEventHandler } from "react";
import type { components } from "../../../api/schema";
import type { ParagraphEditingState } from "../types";
import { handleEditingKeyDown } from "../utils/editingShortcuts";
import { EditableBlock } from "./components/EditableBlock";
import { EditableContentField } from "./components/EditableContentField";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type ParagraphBlockProps = {
  block: ChapterBlock;
};

export function ParagraphBlock({ block }: ParagraphBlockProps) {
  return (
    <EditableBlock<ParagraphEditingState>
      block={block}
      selectEditingState={(state, currentBlock) => {
        if (
          state?.blockType === "paragraph" &&
          state.blockId === currentBlock.id
        ) {
          return state;
        }
        return undefined;
      }}
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

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    handleEditingKeyDown(event, {
      onConfirm: editingState.onSave,
      onCancel: editingState.onCancel,
    });
  };

  return (
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
  );
}
