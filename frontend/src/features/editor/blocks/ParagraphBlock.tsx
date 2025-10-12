import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type { components } from "../../../api/schema";
import { editorThemeConstants } from "../editorTheme";
import { EditorBlockFrame } from "./EditorBlockFrame";

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

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (
    event,
  ) => {
    if (!isEditing) {
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      onSaveEdit?.();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onCancelEdit?.();
    }
  };

  const controls = isEditing ? (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <IconButton
        size="small"
        color="success"
        onClick={onSaveEdit}
        disabled={disabled}
        aria-label="Guardar cambios"
        sx={{
          backgroundColor: "rgba(76, 175, 80, 0.16)",
          '&:hover': {
            backgroundColor: "rgba(76, 175, 80, 0.25)",
          },
        }}
      >
        {disabled ? (
          <CircularProgress size={16} thickness={5} color="inherit" />
        ) : (
          <CheckRoundedIcon sx={{ fontSize: "1.1rem" }} />
        )}
      </IconButton>
      <IconButton
        size="small"
        color="error"
        onClick={onCancelEdit}
        disabled={disabled}
        aria-label="Cancelar edición"
        sx={{
          backgroundColor: "rgba(244, 67, 54, 0.16)",
          '&:hover': {
            backgroundColor: "rgba(244, 67, 54, 0.25)",
          },
        }}
      >
        <CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />
      </IconButton>
    </Stack>
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
            margin: 0,
            pb: 0,
            color: editorThemeConstants.headingColor,
            textIndent: "1.5em",
            outline: "none",
            border: "none",
            fontFamily: "inherit",
            fontSize: "inherit",
            lineHeight: "inherit",
            letterSpacing: "inherit",
            minHeight: "1.4em",
            whiteSpace: "pre-wrap",
          }}
        />
      ) : (
        <Typography
          component="p"
          sx={{
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
