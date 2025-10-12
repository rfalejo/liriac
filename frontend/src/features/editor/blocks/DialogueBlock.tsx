import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useRef } from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import type { components } from "../../../api/schema";
import { editorThemeConstants } from "../editorTheme";
import { EditorBlockFrame } from "./EditorBlockFrame";

type ChapterBlock = components["schemas"]["ChapterBlock"];
type DialogueTurn = components["schemas"]["DialogueTurn"];

type DialogueField = "speakerName" | "utterance" | "stageDirection";

type DialogueBlockProps = {
  block: ChapterBlock;
  onEdit: (blockId: string) => void;
  isEditing?: boolean;
  draftTurns?: DialogueTurn[];
  onChangeTurn?: (index: number, field: DialogueField, value: string) => void;
  onAddTurn?: () => void;
  onRemoveTurn?: (index: number) => void;
  onCancelEdit?: () => void;
  onSaveEdit?: () => void;
  disabled?: boolean;
};

type EditableFieldProps = {
  value: string;
  placeholder: string;
  onChange?: (value: string) => void;
  variant?: "speaker" | "utterance" | "stage";
};

function EditableField({
  value,
  placeholder,
  onChange,
  variant = "utterance",
}: EditableFieldProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value]);

  const handleInput = () => {
    if (!onChange || !ref.current) {
      return;
    }
    onChange(ref.current.textContent ?? "");
  };

  const baseStyles = {
    outline: "none",
    border: "none",
    backgroundColor: "transparent",
    fontFamily: "inherit",
    fontSize: "inherit",
    lineHeight: "inherit",
    letterSpacing: "inherit",
    minHeight: "1.25em",
    whiteSpace: "pre-wrap" as const,
    color: editorThemeConstants.headingColor,
  };

  const variantStyles = {
    speaker: {
      fontSize: "0.85rem",
      fontWeight: 600,
      letterSpacing: "0.04em",
      textTransform: "uppercase" as const,
      color: editorThemeConstants.mutedColor,
    },
    utterance: {
      marginTop: 0.25,
    },
    stage: {
      fontStyle: "italic",
      color: editorThemeConstants.mutedColor,
    },
  } as const;

  return (
    <Box
      ref={ref}
      component="div"
      role="textbox"
      contentEditable
      suppressContentEditableWarning
      spellCheck
      aria-label={placeholder}
      data-variant={variant}
      onInput={handleInput}
      sx={{
        ...baseStyles,
        ...variantStyles[variant],
        "&:empty::before": placeholder
          ? {
              content: `"${placeholder}"`,
              color: "rgba(15, 20, 25, 0.38)",
            }
          : undefined,
      }}
    >
      {value}
    </Box>
  );
}

export function DialogueBlock({
  block,
  onEdit,
  isEditing = false,
  draftTurns,
  onChangeTurn,
  onAddTurn,
  onRemoveTurn,
  onCancelEdit,
  onSaveEdit,
  disabled = false,
}: DialogueBlockProps) {
  const turns = isEditing ? draftTurns ?? [] : block.turns ?? [];

  const controls = isEditing ? (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <IconButton
        size="small"
        color="success"
        onClick={() => {
          void onSaveEdit?.();
        }}
        disabled={disabled}
        aria-label="Guardar cambios"
        sx={{
          backgroundColor: "rgba(76, 175, 80, 0.16)",
          "&:hover": {
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
        onClick={() => {
          onCancelEdit?.();
        }}
        disabled={disabled}
        aria-label="Cancelar edición"
        sx={{
          backgroundColor: "rgba(244, 67, 54, 0.16)",
          "&:hover": {
            backgroundColor: "rgba(244, 67, 54, 0.25)",
          },
        }}
      >
        <CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />
      </IconButton>
    </Stack>
  ) : undefined;

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

  return (
    <EditorBlockFrame
      blockId={block.id}
      blockType={block.type}
      onEdit={isEditing ? undefined : onEdit}
      controls={controls}
      isActive={isEditing}
    >
      <Stack
        spacing={1.25}
        sx={{ color: editorThemeConstants.headingColor }}
        onKeyDown={handleKeyDown}
      >
        {turns.length === 0 && (
          <Typography variant="body2" color={editorThemeConstants.mutedColor}>
            (Diálogo sin intervenciones)
          </Typography>
        )}
        {turns.map((turn, index) => (
          <Box
            key={`${block.id}-turn-${index}`}
            sx={{
              borderRadius: 1,
              px: { xs: 1.25, sm: 1.5 },
              py: { xs: 1, sm: 1.25 },
              transition: "background-color 140ms ease, box-shadow 140ms ease",
              position: "relative",
              backgroundColor: "transparent",
              boxShadow: "0 0 0 1px transparent",
              "&:focus-within": {
                backgroundColor: "rgba(25, 118, 210, 0.08)",
                boxShadow: "0 0 0 1px rgba(25, 118, 210, 0.35)",
              },
            }}
          >
            {isEditing ? (
              <EditableField
                value={turn.speakerName ?? ""}
                onChange={(value) => onChangeTurn?.(index, "speakerName", value)}
                placeholder="Nombre del personaje"
                variant="speaker"
              />
            ) : (
              turn.speakerName && (
                <Typography
                  component="span"
                  sx={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: editorThemeConstants.mutedColor,
                  }}
                >
                  {turn.speakerName}
                </Typography>
              )
            )}

            {isEditing ? (
              <EditableField
                value={turn.utterance ?? ""}
                onChange={(value) => onChangeTurn?.(index, "utterance", value)}
                placeholder="Contenido del parlamento"
                variant="utterance"
              />
            ) : (
              <Typography component="p" sx={{ margin: 0 }}>
                {turn.utterance}
              </Typography>
            )}

            {isEditing ? (
              <EditableField
                value={turn.stageDirection ?? ""}
                onChange={(value) =>
                  onChangeTurn?.(index, "stageDirection", value)
                }
                placeholder="Acotación opcional"
                variant="stage"
              />
            ) : (
              turn.stageDirection && (
                <Typography
                  component="span"
                  sx={{
                    fontStyle: "italic",
                    color: editorThemeConstants.mutedColor,
                  }}
                >
                  {turn.stageDirection}
                </Typography>
              )
            )}

            {isEditing && onRemoveTurn && turns.length > 0 && (
              <IconButton
                size="small"
                onClick={() => onRemoveTurn(index)}
                aria-label="Eliminar parlamento"
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  opacity: 0.6,
                  transition: "opacity 140ms ease",
                  "&:hover": {
                    opacity: 1,
                  },
                }}
              >
                <DeleteOutlineRoundedIcon sx={{ fontSize: "1.1rem" }} />
              </IconButton>
            )}
          </Box>
        ))}

        {isEditing && onAddTurn && (
          <IconButton
            onClick={onAddTurn}
            disabled={disabled}
            aria-label="Agregar parlamento"
            sx={{
              alignSelf: "flex-start",
              color: "rgba(25, 118, 210, 0.75)",
            }}
          >
            <AddCircleOutlineRoundedIcon sx={{ fontSize: "1.3rem" }} />
          </IconButton>
        )}
      </Stack>
    </EditorBlockFrame>
  );
}
