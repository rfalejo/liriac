import { Box, IconButton, Stack, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import type { ChapterBlock, DialogueEditingState } from "../types";
import { EditableDialogueTurn } from "./components/EditableDialogueTurn";
import { EditableBlock } from "./components/EditableBlock";
import {
  createBlockEditingSelector,
  createEditingShortcutHandler,
} from "./utils/blockEditingHelpers";

type DialogueBlockProps = {
  block: ChapterBlock;
};

export function DialogueBlock({ block }: DialogueBlockProps) {
  return (
    <EditableBlock<DialogueEditingState>
      block={block}
      selectEditingState={createBlockEditingSelector("dialogue")}
      renderReadView={(currentBlock) => (
        <DialogueReadView block={currentBlock} />
      )}
      renderEditView={(currentBlock, editing) => (
        <DialogueEditView block={currentBlock} editingState={editing} />
      )}
    />
  );
}

type DialogueViewProps = {
  block: ChapterBlock;
};

function DialogueReadView({ block }: DialogueViewProps) {
  const turns = block.turns ?? [];

  return (
    <Stack
      spacing={1.25}
      sx={(theme: Theme) => ({ color: theme.palette.editor.blockHeading })}
    >
      {turns.length === 0 && (
        <Typography
          variant="body2"
          sx={(theme: Theme) => theme.typography.editorMuted}
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
              transition: theme.editor.blockTransition,
              position: "relative",
              backgroundColor: "transparent",
              boxShadow: "0 0 0 1px transparent",
            })}
          >
            <Stack spacing={0.5}>
              {turn.speakerName && (
                <Typography
                  component="span"
                  sx={(theme: Theme) => theme.typography.editorDialogueSpeaker}
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
                  sx={(theme: Theme) => theme.typography.editorStageDirection}
                >
                  {turn.stageDirection}
                </Typography>
              )}
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}

type DialogueEditViewProps = {
  block: ChapterBlock;
  editingState: DialogueEditingState;
};

function DialogueEditView({ block, editingState }: DialogueEditViewProps) {
  const { dialogue, isSaving } = editingState;
  const turns = dialogue.turns ?? [];
  const handleKeyDown = createEditingShortcutHandler(editingState);

  return (
    <Stack
      spacing={1.25}
      sx={(theme: Theme) => ({ color: theme.palette.editor.blockHeading })}
    >
      {turns.length === 0 && (
        <Typography
          variant="body2"
          sx={(theme: Theme) => theme.typography.editorMuted}
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
              transition: theme.editor.blockTransition,
              position: "relative",
              backgroundColor: "transparent",
              boxShadow: "0 0 0 1px transparent",
              "&:focus-within": {
                backgroundColor: theme.palette.editor.blockActiveBg,
                boxShadow: `0 0 0 1px ${theme.palette.editor.blockActiveOutline}`,
              },
            })}
          >
            <EditableDialogueTurn
              turnKey={turn.id ?? turnKey}
              turn={turn}
              disabled={isSaving}
              onChangeTurn={dialogue.onChangeTurn}
              onKeyDown={handleKeyDown}
            />

            {dialogue.onRemoveTurn && turns.length > 0 && (
              <IconButton
                size="small"
                onClick={() => dialogue.onRemoveTurn?.(turn.id ?? turnKey)}
                aria-label="Eliminar parlamento"
                sx={(theme: Theme) => ({
                  position: "absolute",
                  top: 8,
                  right: 8,
                  opacity: 0.6,
                  transition: theme.editor.blockControlsFade,
                  "&:hover": {
                    opacity: 1,
                  },
                })}
                disabled={isSaving}
              >
                <DeleteOutlineRoundedIcon sx={{ fontSize: "1.1rem" }} />
              </IconButton>
            )}
          </Box>
        );
      })}

      {dialogue.onAddTurn && (
        <IconButton
          onClick={dialogue.onAddTurn}
          disabled={isSaving}
          aria-label="Agregar parlamento"
          sx={(theme: Theme) => ({
            alignSelf: "flex-start",
            color: theme.palette.editor.controlAddColor,
            transition: theme.editor.iconButtonTransition,
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
  );
}
