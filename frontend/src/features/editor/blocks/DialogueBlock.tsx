import { Box, IconButton, Stack, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { KeyboardEvent } from "react";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { EditorBlockFrame } from "./EditorBlockFrame";
import type { ChapterBlock } from "../types";
import { EditableDialogueTurn } from "./components/EditableDialogueTurn";
import { BlockEditControls } from "./components/BlockEditControls";
import { useEditorBlockEditing } from "../context/EditorBlockEditingContext";

type DialogueBlockProps = {
  block: ChapterBlock;
};

export function DialogueBlock({ block }: DialogueBlockProps) {
  const { editingState, onEditBlock } = useEditorBlockEditing();

  const isEditing =
    editingState?.blockType === "dialogue" && editingState.blockId === block.id
      ? editingState
      : undefined;

  const draftTurns = isEditing ? isEditing.dialogue.turns : block.turns;
  const onChangeTurn = isEditing?.dialogue.onChangeTurn;
  const onAddTurn = isEditing?.dialogue.onAddTurn;
  const onRemoveTurn = isEditing?.dialogue.onRemoveTurn;
  const onCancelEdit = isEditing?.onCancel;
  const onSaveEdit = isEditing?.onSave;
  const disabled = isEditing?.isSaving ?? false;

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
    <BlockEditControls
      onConfirm={onSaveEdit}
      onCancel={onCancelEdit}
      disabled={disabled}
    />
  ) : undefined;

  return (
    <EditorBlockFrame
      blockId={block.id}
      blockType={block.type}
      onEdit={isEditing ? undefined : onEditBlock}
      controls={controls}
      isActive={Boolean(isEditing)}
    >
      <Stack
        spacing={1.25}
        sx={(theme: Theme) => ({ color: theme.palette.editor.blockHeading })}
      >
        {turns.length === 0 && (
          <Typography
            variant="body2"
            sx={(theme: Theme) => ({
              ...theme.typography.editorBody,
              color: theme.palette.editor.blockMuted,
            })}
          >
            (Diálogo sin intervenciones)
          </Typography>
        )}
        {turns.map((turn, index) => {
          const turnKey = turn.id ?? `${block.id}-turn-${index}`;
          return (
            <Box
              key={turnKey}
              sx={(theme: Theme) => ({
                borderRadius: 1,
                px: { xs: 1.25, sm: 1.5 },
                py: { xs: 1, sm: 1.25 },
                transition:
                  "background-color 140ms ease, box-shadow 140ms ease",
                position: "relative",
                backgroundColor: "transparent",
                boxShadow: "0 0 0 1px transparent",
                "&:focus-within": {
                  backgroundColor: theme.palette.editor.blockActiveBg,
                  boxShadow: `0 0 0 1px ${theme.palette.editor.blockActiveOutline}`,
                },
              })}
            >
              {isEditing ? (
                <EditableDialogueTurn
                  turnKey={turn.id ?? turnKey}
                  turn={turn}
                  disabled={disabled}
                  onChangeTurn={onChangeTurn}
                  onKeyDown={handleKeyDown}
                />
              ) : (
                <Stack spacing={0.5}>
                  {turn.speakerName && (
                    <Typography
                      component="span"
                      sx={(theme: Theme) => ({
                        ...theme.typography.editorBody,
                        display: "block",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: theme.palette.editor.blockMuted,
                      })}
                    >
                      {turn.speakerName}
                    </Typography>
                  )}
                  <Typography
                    component="p"
                    sx={(theme: Theme) => ({
                      ...theme.typography.editorBody,
                      margin: 0,
                    })}
                  >
                    {turn.utterance}
                  </Typography>
                  {turn.stageDirection && (
                    <Typography
                      component="span"
                      sx={(theme: Theme) => ({
                        ...theme.typography.editorBody,
                        fontStyle: "italic",
                        color: theme.palette.editor.blockMuted,
                      })}
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
            sx={(theme: Theme) => ({
              alignSelf: "flex-start",
              color: theme.palette.editor.controlAddColor,
              "&:hover": {
                color: theme.palette.editor.controlAddHoverColor,
              },
              "&.Mui-disabled": {
                color: theme.palette.editor.controlAddDisabledColor,
              },
            })}
          >
            <AddCircleOutlineRoundedIcon sx={{ fontSize: "1.3rem" }} />
          </IconButton>
        )}
      </Stack>
    </EditorBlockFrame>
  );
}
