import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { KeyboardEvent } from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { editorThemeConstants } from "../editorTheme";
import { EditorBlockFrame } from "./EditorBlockFrame";
import type { ChapterBlock, DialogueField, DialogueTurn } from "../types";

type DialogueBlockProps = {
  block: ChapterBlock;
  onEdit: (blockId: string) => void;
  isEditing?: boolean;
  draftTurns?: DialogueTurn[];
  onChangeTurn?: (turnId: string, field: DialogueField, value: string) => void;
  onAddTurn?: () => void;
  onRemoveTurn?: (turnId: string) => void;
  onCancelEdit?: () => void;
  onSaveEdit?: () => void;
  disabled?: boolean;
};

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
  const turns = isEditing ? (draftTurns ?? []) : (block.turns ?? []);

  const handleKeyDown = (event: KeyboardEvent) => {
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

  return (
    <EditorBlockFrame
      blockId={block.id}
      blockType={block.type}
      onEdit={isEditing ? undefined : onEdit}
      controls={controls}
      isActive={isEditing}
    >
      <Stack spacing={1.25} sx={{ color: editorThemeConstants.headingColor }}>
        {turns.length === 0 && (
          <Typography variant="body2" color={editorThemeConstants.mutedColor}>
            (Diálogo sin intervenciones)
          </Typography>
        )}
        {turns.map((turn, index) => {
          const turnKey = turn.id ?? `${block.id}-turn-${index}`;
          return (
            <Box
              key={turnKey}
              sx={{
                borderRadius: 1,
                px: { xs: 1.25, sm: 1.5 },
                py: { xs: 1, sm: 1.25 },
                transition:
                  "background-color 140ms ease, box-shadow 140ms ease",
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
                <Stack spacing={1}>
                  <TextField
                    label="Personaje"
                    value={turn.speakerName ?? ""}
                    onChange={(event) =>
                      onChangeTurn?.(
                        turn.id ?? turnKey,
                        "speakerName",
                        event.target.value,
                      )
                    }
                    onKeyDown={handleKeyDown}
                    variant="standard"
                    fullWidth
                    disabled={disabled}
                  />
                  <TextField
                    label="Parlamento"
                    value={turn.utterance ?? ""}
                    onChange={(event) =>
                      onChangeTurn?.(
                        turn.id ?? turnKey,
                        "utterance",
                        event.target.value,
                      )
                    }
                    onKeyDown={handleKeyDown}
                    variant="outlined"
                    fullWidth
                    multiline
                    minRows={3}
                    disabled={disabled}
                  />
                  <TextField
                    label="Acotación"
                    value={turn.stageDirection ?? ""}
                    onChange={(event) =>
                      onChangeTurn?.(
                        turn.id ?? turnKey,
                        "stageDirection",
                        event.target.value,
                      )
                    }
                    onKeyDown={handleKeyDown}
                    variant="outlined"
                    fullWidth
                    multiline
                    minRows={2}
                    disabled={disabled}
                  />
                </Stack>
              ) : (
                <Stack spacing={0.5}>
                  {turn.speakerName && (
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
                  )}
                  <Typography component="p" sx={{ margin: 0 }}>
                    {turn.utterance}
                  </Typography>
                  {turn.stageDirection && (
                    <Typography
                      component="span"
                      sx={{
                        fontStyle: "italic",
                        color: editorThemeConstants.mutedColor,
                      }}
                    >
                      {turn.stageDirection}
                    </Typography>
                  )}
                </Stack>
              )}

              {isEditing && onRemoveTurn && turns.length > 0 && (
                <IconButton
                  size="small"
                  onClick={() => onRemoveTurn(turn.id ?? turnKey)}
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
                  disabled={disabled}
                >
                  <DeleteOutlineRoundedIcon sx={{ fontSize: "1.1rem" }} />
                </IconButton>
              )}
            </Box>
          );
        })}

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
