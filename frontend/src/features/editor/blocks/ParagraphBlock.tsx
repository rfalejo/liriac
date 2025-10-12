import { Box, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import type { components } from "../../../api/schema";
import { editorBodyTypographySx, editorThemeConstants } from "../editorTheme";
import { EditorBlockFrame } from "./EditorBlockFrame";
import { BlockEditControls } from "./components/BlockEditControls";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type ParagraphBlockProps = {
  block: ChapterBlock;
  onEdit: (blockId: string) => void;
  isEditing?: boolean;
  draftText?: string;
  onDraftChange?: (value: string) => void;
  onCancelEdit?: () => void;
  onSaveEdit?: () => void;
  disabled?: boolean;
};

export function ParagraphBlock({
  block,
  onEdit,
  isEditing = false,
  draftText = "",
  onDraftChange,
  onCancelEdit,
  onSaveEdit,
  disabled = false,
}: ParagraphBlockProps) {
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
      onEdit={isEditing ? undefined : onEdit}
      controls={controls}
      isActive={isEditing}
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
          sx={{
            ...editorBodyTypographySx,
            margin: 0,
            pb: 0,
            color: editorThemeConstants.headingColor,
            textIndent: "1.5em",
            outline: "none",
            border: "none",
            minHeight: "1.4em",
            whiteSpace: "pre-wrap",
          }}
        />
      ) : (
        <Typography
          component="p"
          sx={{
            ...editorBodyTypographySx,
            margin: 0,
            pb: 0,
            color: editorThemeConstants.headingColor,
            textIndent: "1.5em",
          }}
        >
          {content.length > 0 ? content : "(Sin texto en este párrafo)"}
        </Typography>
      )}
    </EditorBlockFrame>
  );
}
