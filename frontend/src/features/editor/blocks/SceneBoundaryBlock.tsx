import { Divider, Stack, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { components } from "../../../api/schema";
import type { SceneBoundaryEditingState } from "../types";
import { EditableBlock } from "./components/EditableBlock";
import { EditableContentField } from "./components/EditableContentField";
import { handleEditingKeyDown } from "../utils/editingShortcuts";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type SceneBoundaryBlockProps = {
  block: ChapterBlock;
};

export function SceneBoundaryBlock({ block }: SceneBoundaryBlockProps) {
  return (
    <EditableBlock<SceneBoundaryEditingState>
      block={block}
      selectEditingState={(state, currentBlock) => {
        if (
          state?.blockType === "scene_boundary" &&
          state.blockId === currentBlock.id
        ) {
          return state;
        }
        return undefined;
      }}
      renderReadView={(currentBlock) => (
        <SceneBoundaryReadView block={currentBlock} />
      )}
      renderEditView={(_, editing) => (
        <SceneBoundaryEditView editingState={editing} />
      )}
    />
  );
}

type SceneBoundaryViewProps = {
  block: ChapterBlock;
};

function SceneBoundaryReadView({ block }: SceneBoundaryViewProps) {
  return (
    <Stack spacing={1} alignItems="center" sx={{ textAlign: "center" }}>
      <Divider
        flexItem
        sx={(theme: Theme) => ({
          borderColor: theme.palette.editor.blockDivider,
        })}
      />
      {(block.label || block.summary) && (
        <Typography
          variant="body2"
          sx={(theme: Theme) => ({
            ...theme.typography.editorBody,
            color: theme.palette.editor.blockMuted,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          })}
        >
          {block.label ?? block.summary}
        </Typography>
      )}
    </Stack>
  );
}

type SceneBoundaryEditViewProps = {
  editingState: SceneBoundaryEditingState;
};

function SceneBoundaryEditView({ editingState }: SceneBoundaryEditViewProps) {
  const { draft, onChangeField } = editingState.sceneBoundary;
  const disabled = editingState.isSaving;

  return (
    <Stack spacing={1.25} sx={{ textAlign: "center" }}>
      <Divider
        flexItem
        sx={(theme: Theme) => ({
          borderColor: theme.palette.editor.blockDivider,
        })}
      />
      <EditableContentField
        value={draft.label}
        onChange={(value) => onChangeField("label", value)}
        ariaLabel="Etiqueta de la escena"
        placeholder="Agrega una etiqueta"
        disabled={disabled}
        sx={(theme: Theme) => ({
          ...theme.typography.editorBody,
          color: theme.palette.editor.blockMuted,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          borderRadius: theme.editor.blockRadius,
          padding: theme.spacing(1, 1.5),
          boxShadow: `inset 0 0 0 1px ${theme.palette.editor.blockHoverOutline}`,
          transition: theme.editor.blockTransition,
          backgroundColor: theme.palette.editor.blockActiveBg,
          "&:focus": {
            boxShadow: `inset 0 0 0 1px ${theme.palette.editor.blockActiveOutline}`,
          },
        })}
        onKeyDown={(event) => {
          handleEditingKeyDown(event, {
            onConfirm: editingState.onSave,
            onCancel: editingState.onCancel,
          });
        }}
      />
      <EditableContentField
        value={draft.summary}
        onChange={(value) => onChangeField("summary", value)}
        ariaLabel="Resumen del límite de escena"
        placeholder="Describe brevemente la transición"
        multiline
        disabled={disabled}
        sx={(theme: Theme) => ({
          ...theme.typography.editorBody,
          color: theme.palette.editor.blockMuted,
          borderRadius: theme.editor.blockRadius,
          padding: theme.spacing(1, 1.5),
          boxShadow: `inset 0 0 0 1px ${theme.palette.editor.blockHoverOutline}`,
          transition: theme.editor.blockTransition,
          backgroundColor: theme.palette.editor.blockActiveBg,
          textAlign: "left",
          "&:focus": {
            boxShadow: `inset 0 0 0 1px ${theme.palette.editor.blockActiveOutline}`,
          },
        })}
        onKeyDown={(event) => {
          handleEditingKeyDown(event, {
            onConfirm: editingState.onSave,
            onCancel: editingState.onCancel,
          });
        }}
      />
    </Stack>
  );
}
