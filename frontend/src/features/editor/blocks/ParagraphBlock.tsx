import { Box, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { useEffect, useRef, useState } from "react";
import type { components } from "../../../api/schema";
import { useEditorBlockEditing } from "../context/EditorBlockEditingContext";
import { EditorBlockFrame } from "./EditorBlockFrame";
import { BlockEditControls } from "./components/BlockEditControls";

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

    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void onSaveEdit?.();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onCancelEdit?.();
    }
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
          sx={(theme: Theme) => ({
            ...theme.typography.editorBody,
            margin: 0,
            pb: 0,
            color: theme.palette.editor.blockHeading,
            textIndent: "1.5em",
            outline: "none",
            border: "none",
            minHeight: "1.4em",
            whiteSpace: "pre-wrap",
          })}
        />
      ) : (
        <Typography
          component="p"
          sx={(theme: Theme) => ({
            ...theme.typography.editorBody,
            margin: 0,
            pb: 0,
            color: theme.palette.editor.blockHeading,
            textIndent: "1.5em",
          })}
        >
          {content.length > 0 ? content : "(Sin texto en este párrafo)"}
        </Typography>
      )}
    </EditorBlockFrame>
  );
}
