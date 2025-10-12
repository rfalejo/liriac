import { Divider, Stack, TextField, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { components } from "../../../api/schema";
import type { SceneBoundaryEditingState } from "../types";
import { EditableBlock } from "./components/EditableBlock";

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
      <TextField
        label="Etiqueta"
        value={draft.label}
        onChange={(event) => onChangeField("label", event.target.value)}
        disabled={disabled}
        size="small"
        fullWidth
        inputProps={{ style: { textTransform: "uppercase", letterSpacing: "0.08em" } }}
      />
      <TextField
        label="Resumen"
        value={draft.summary}
        onChange={(event) => onChangeField("summary", event.target.value)}
        disabled={disabled}
        size="small"
        fullWidth
        multiline
        minRows={2}
      />
    </Stack>
  );
}
