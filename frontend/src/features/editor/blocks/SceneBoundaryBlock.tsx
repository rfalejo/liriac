import { Divider, Stack, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { components } from "../../../api/schema";
import type { SceneBoundaryEditingState } from "../types";
import { EditableBlock } from "./components/EditableBlock";
import { EditableContentField } from "./components/EditableContentField";
import {
  createBlockEditingSelector,
  createEditingShortcutHandler,
} from "./utils/blockEditingHelpers";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type SceneBoundaryBlockProps = {
  block: ChapterBlock;
};

export function SceneBoundaryBlock({ block }: SceneBoundaryBlockProps) {
  return (
    <EditableBlock<SceneBoundaryEditingState>
      block={block}
      selectEditingState={createBlockEditingSelector("scene_boundary")}
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
        sx={(theme: Theme) => theme.editor.blocks.divider}
      />
      {(block.label || block.summary) && (
        <Typography
          variant="body2"
          sx={(theme: Theme) => ({
            ...theme.typography.editorBody,
            ...theme.editor.blocks.uppercaseLabel,
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
  const handleShortcuts = createEditingShortcutHandler(editingState);

  return (
    <Stack spacing={1.25} sx={{ textAlign: "center" }}>
      <Divider
        flexItem
        sx={(theme: Theme) => theme.editor.blocks.divider}
      />
      <EditableContentField
        value={draft.label}
        onChange={(value) => onChangeField("label", value)}
        ariaLabel="Etiqueta de la escena"
        placeholder="Agrega una etiqueta"
        disabled={disabled}
        sx={(theme: Theme) => ({
          ...theme.typography.editorBody,
          ...theme.editor.blocks.uppercaseLabel,
          ...theme.editor.blocks.interactiveField,
        })}
        onKeyDown={handleShortcuts}
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
          ...theme.editor.blocks.interactiveField,
          color: theme.palette.editor.blockMuted,
          textAlign: "left",
        })}
        onKeyDown={handleShortcuts}
      />
    </Stack>
  );
}
