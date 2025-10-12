import { Stack, TextField, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { components } from "../../../api/schema";
import type { MetadataEditingState } from "../types";
import { EditableBlock } from "./components/EditableBlock";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type MetadataBlockProps = {
  block: ChapterBlock;
};

export function MetadataBlock({ block }: MetadataBlockProps) {
  return (
    <EditableBlock<MetadataEditingState>
      block={block}
      selectEditingState={(state, currentBlock) => {
        if (state?.blockType === "metadata" && state.blockId === currentBlock.id) {
          return state;
        }
        return undefined;
      }}
      renderReadView={(currentBlock) => (
        <MetadataReadView block={currentBlock} />
      )}
      renderEditView={(currentBlock, editing) => (
        <MetadataEditView block={currentBlock} editingState={editing} />
      )}
    />
  );
}

type MetadataViewProps = {
  block: ChapterBlock;
};

function MetadataReadView({ block }: MetadataViewProps) {
  const kind = block.kind ?? "metadata";

  if (kind === "chapter_header") {
    const primaryHeading = block.title ?? block.subtitle;
    const shouldShowSupportingTitle = Boolean(
      block.subtitle && block.title && block.subtitle !== block.title,
    );

    return (
      <Stack spacing={1} textAlign="center">
        {typeof block.ordinal === "number" && (
          <Typography
            variant="caption"
            sx={(theme: Theme) => ({
              fontFamily: theme.typography.editorBody.fontFamily,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: theme.palette.editor.blockMuted,
              opacity: 0.75,
            })}
          >
            Capítulo {block.ordinal + 1}
          </Typography>
        )}
        {primaryHeading && (
          <Typography
            variant="h4"
            sx={(theme: Theme) => ({
              fontFamily: "inherit",
              color: theme.palette.editor.blockHeading,
            })}
          >
            {primaryHeading}
          </Typography>
        )}
        {shouldShowSupportingTitle && (
          <Typography
            variant="subtitle2"
            sx={(theme: Theme) => ({
              fontFamily: theme.typography.editorBody.fontFamily,
              color: theme.palette.editor.blockMuted,
              fontWeight: 500,
              letterSpacing: "0.04em",
            })}
          >
            {block.subtitle}
          </Typography>
        )}
        {block.epigraph && (
          <Stack spacing={0.5} sx={{ mt: 1.25 }}>
            <Typography
              component="blockquote"
              sx={(theme: Theme) => ({
                ...theme.typography.editorBody,
                fontStyle: "italic",
                margin: 0,
              })}
            >
              “{block.epigraph}”
            </Typography>
            {block.epigraphAttribution && (
              <Typography
                variant="caption"
                sx={(theme: Theme) => ({
                  fontFamily: theme.typography.editorBody.fontFamily,
                  color: theme.palette.editor.blockMuted,
                })}
              >
                — {block.epigraphAttribution}
              </Typography>
            )}
          </Stack>
        )}
      </Stack>
    );
  }

  if (kind === "context") {
    const contextText = block.context?.trim() ?? block.text?.trim();

    return (
      <Typography
        variant="body2"
        sx={(theme: Theme) => ({
          ...theme.typography.editorBody,
          fontStyle: "italic",
          color: theme.palette.editor.blockMuted,
        })}
      >
        {contextText && contextText.length > 0
          ? contextText
          : "(Sin contexto disponible)"}
      </Typography>
    );
  }

  return (
    <Typography
      variant="body2"
      sx={(theme: Theme) => ({
        ...theme.typography.editorBody,
        color: theme.palette.editor.blockMuted,
      })}
    >
      {block.text && block.text.length > 0
        ? block.text
        : "(Bloque de metadatos sin contenido)"}
    </Typography>
  );
}

type MetadataEditViewProps = {
  block: ChapterBlock;
  editingState: MetadataEditingState;
};

function MetadataEditView({ block, editingState }: MetadataEditViewProps) {
  const { metadata, isSaving } = editingState;
  const kind = metadata.kind ?? block.kind ?? "metadata";
  const { draft, onChangeField } = metadata;

  if (kind === "chapter_header") {
    return (
      <Stack spacing={1.25} textAlign="center">
        {typeof block.ordinal === "number" && (
          <Typography
            variant="caption"
            sx={(theme: Theme) => ({
              fontFamily: theme.typography.editorBody.fontFamily,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: theme.palette.editor.blockMuted,
              opacity: 0.75,
            })}
          >
            Capítulo {block.ordinal + 1}
          </Typography>
        )}
        <TextField
          label="Título"
          value={draft.title}
          onChange={(event) => onChangeField("title", event.target.value)}
          disabled={isSaving}
          fullWidth
        />
        <TextField
          label="Subtítulo"
          value={draft.subtitle}
          onChange={(event) => onChangeField("subtitle", event.target.value)}
          disabled={isSaving}
          fullWidth
        />
        <TextField
          label="Epígrafe"
          value={draft.epigraph}
          onChange={(event) => onChangeField("epigraph", event.target.value)}
          disabled={isSaving}
          fullWidth
          multiline
          minRows={2}
        />
        <TextField
          label="Atribución"
          value={draft.epigraphAttribution}
          onChange={(event) =>
            onChangeField("epigraphAttribution", event.target.value)
          }
          disabled={isSaving}
          fullWidth
        />
      </Stack>
    );
  }

  if (kind === "context") {
    return (
      <TextField
        label="Contexto"
        value={draft.context}
        onChange={(event) => onChangeField("context", event.target.value)}
        disabled={isSaving}
        fullWidth
        multiline
        minRows={3}
      />
    );
  }

  return (
    <TextField
      label="Contenido"
      value={draft.text}
      onChange={(event) => onChangeField("text", event.target.value)}
      disabled={isSaving}
      fullWidth
      multiline
      minRows={3}
    />
  );
}
