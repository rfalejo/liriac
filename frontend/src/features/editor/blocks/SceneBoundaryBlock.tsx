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
  const sceneDetails = block.sceneDetails;
  const location = sceneDetails?.locationName ?? block.locationName;
  const timestamp = sceneDetails?.timestamp ?? block.timestamp;
  const mood = sceneDetails?.mood ?? block.mood;

  return (
    <Stack spacing={1} alignItems="center" sx={{ textAlign: "center" }}>
      <Divider flexItem sx={(theme: Theme) => theme.editor.blocks.divider} />
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
      {(location || timestamp || mood) && (
        <Stack spacing={0.5} sx={{ color: "text.secondary" }}>
          {location && (
            <Typography variant="caption" sx={{ display: "block" }}>
              Ubicación: {location}
            </Typography>
          )}
          {timestamp && (
            <Typography variant="caption" sx={{ display: "block" }}>
              Momento: {timestamp}
            </Typography>
          )}
          {mood && (
            <Typography variant="caption" sx={{ display: "block" }}>
              Atmósfera: {mood}
            </Typography>
          )}
        </Stack>
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
      <Divider flexItem sx={(theme: Theme) => theme.editor.blocks.divider} />
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
      <EditableContentField
        value={draft.locationName}
        onChange={(value) => onChangeField("locationName", value)}
        ariaLabel="Ubicación de la escena"
        placeholder="Ubicación (opcional)"
        disabled={disabled}
        sx={(theme: Theme) => ({
          ...theme.typography.editorBody,
          ...theme.editor.blocks.interactiveField,
          color: theme.palette.editor.blockMuted,
        })}
        onKeyDown={handleShortcuts}
      />
      <EditableContentField
        value={draft.timestamp}
        onChange={(value) => onChangeField("timestamp", value)}
        ariaLabel="Momento de la escena"
        placeholder="Marca temporal (opcional)"
        disabled={disabled}
        sx={(theme: Theme) => ({
          ...theme.typography.editorBody,
          ...theme.editor.blocks.interactiveField,
          color: theme.palette.editor.blockMuted,
        })}
        onKeyDown={handleShortcuts}
      />
      <EditableContentField
        value={draft.mood}
        onChange={(value) => onChangeField("mood", value)}
        ariaLabel="Atmósfera de la escena"
        placeholder="Atmósfera o tono (opcional)"
        disabled={disabled}
        sx={(theme: Theme) => ({
          ...theme.typography.editorBody,
          fontStyle: "italic",
          ...theme.editor.blocks.interactiveField,
          color: theme.palette.editor.blockMuted,
        })}
        onKeyDown={handleShortcuts}
      />
    </Stack>
  );
}
