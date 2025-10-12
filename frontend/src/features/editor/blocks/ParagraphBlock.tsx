import { Box, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { useEffect, useRef, useState } from "react";
import type { components } from "../../../api/schema";
import type { ParagraphEditingState } from "../types";
import { handleEditingKeyDown } from "../utils/editingShortcuts";
import { EditableBlock } from "./components/EditableBlock";

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
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const draftText = editingState.paragraph.draftText;

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    if (!hasInitialized) {
      editorRef.current.focus();
      setHasInitialized(true);
    }

    if (editorRef.current.textContent !== draftText) {
      editorRef.current.textContent = draftText;
    }
  }, [draftText, hasInitialized]);

  useEffect(() => {
    setHasInitialized(false);
  }, [blockId]);

  const handleInput = () => {
    if (!editorRef.current) {
      return;
    }
    editingState.paragraph.onChangeDraft(
      editorRef.current.textContent ?? "",
    );
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    handleEditingKeyDown(event, {
      onConfirm: editingState.onSave,
      onCancel: editingState.onCancel,
    });
  };

  return (
    <Box
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline
      aria-label="Editor de párrafo"
      spellCheck
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      sx={(theme: Theme) => theme.typography.editorParagraphEditable}
    />
  );
}
