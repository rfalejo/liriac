import { Box, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { useEffect, useRef, useState } from "react";
import type { components } from "../../../api/schema";
import { useEditorBlockEditing } from "../context/EditorBlockEditingContext";
import { EditorBlockFrame } from "./EditorBlockFrame";
import { BlockEditControls } from "./components/BlockEditControls";
import { handleEditingKeyDown } from "../utils/editingShortcuts";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type ParagraphBlockProps = {
  block: ChapterBlock;
};

export function ParagraphBlock({ block }: ParagraphBlockProps) {
  const { editingState, onEditBlock } = useEditorBlockEditing();

  const isEditing =
    editingState?.blockType === "paragraph" && editingState.blockId === block.id
      ? editingState
      : undefined;

  const draftText = isEditing ? isEditing.paragraph.draftText : "";
  const onDraftChange = isEditing?.paragraph.onChangeDraft;
  const onCancelEdit = isEditing?.onCancel;
  const onSaveEdit = isEditing?.onSave;
  const disabled = isEditing?.isSaving ?? false;

  const content = block.text?.trim() ?? "";
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!isEditing || !editorRef.current) {
      return;
    }

    if (!hasInitialized) {
      editorRef.current.focus();
      setHasInitialized(true);
    }

    if (editorRef.current.textContent !== draftText) {
      editorRef.current.textContent = draftText;
    }
  }, [draftText, isEditing, hasInitialized]);

  useEffect(() => {
    if (!isEditing) {
      setHasInitialized(false);
    }
  }, [isEditing]);

  const handleInput = () => {
    if (!onDraftChange || !editorRef.current) {
      return;
    }

    onDraftChange(editorRef.current.textContent ?? "");
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (!isEditing) {
      return;
    }
    handleEditingKeyDown(event, {
      onConfirm: onSaveEdit,
      onCancel: onCancelEdit,
    });
  };

  const controls = isEditing ? (
    <BlockEditControls
      onConfirm={onSaveEdit}
      onCancel={onCancelEdit}
      disabled={disabled}
    />
  ) : null;

  return (
    <EditorBlockFrame
      blockId={block.id}
      blockType={block.type}
      onEdit={isEditing ? undefined : onEditBlock}
      controls={controls}
      isActive={Boolean(isEditing)}
    >
      {isEditing ? (
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
      ) : (
        <Typography
          component="p"
          sx={(theme: Theme) => theme.typography.editorParagraph}
        >
          {content.length > 0 ? content : "(Sin texto en este párrafo)"}
        </Typography>
      )}
    </EditorBlockFrame>
  );
}
