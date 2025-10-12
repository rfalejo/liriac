import { Stack, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { components } from "../../../api/schema";
import type { MetadataEditingState } from "../types";
import { EditableBlock } from "./components/EditableBlock";
import { EditableContentField } from "./components/EditableContentField";
import {
  createBlockEditingSelector,
  createEditingShortcutHandler,
} from "./utils/blockEditingHelpers";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type MetadataBlockProps = {
  block: ChapterBlock;
};

export function MetadataBlock({ block }: MetadataBlockProps) {
  if ((block.kind ?? "metadata") === "editorial") {
    return null;
  }

  return (
    <EditableBlock<MetadataEditingState>
      block={block}
      selectEditingState={createBlockEditingSelector("metadata")}
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
  const handleShortcuts = createEditingShortcutHandler(editingState);

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
        <EditableContentField
          value={draft.title}
          onChange={(value) => onChangeField("title", value)}
          ariaLabel="Título del capítulo"
          placeholder="Escribe el título"
          disabled={isSaving}
          sx={(theme: Theme) => ({
            ...theme.typography.editorBody,
            fontSize: theme.typography.h4.fontSize,
            fontWeight: theme.typography.h4.fontWeight,
            color: theme.palette.editor.blockHeading,
            textAlign: "center",
            ...theme.editor.blocks.interactiveField,
          })}
          onKeyDown={handleShortcuts}
        />
        <EditableContentField
          value={draft.subtitle}
          onChange={(value) => onChangeField("subtitle", value)}
          ariaLabel="Subtítulo del capítulo"
          placeholder="Agrega un subtítulo"
          disabled={isSaving}
          sx={(theme: Theme) => ({
            ...theme.typography.editorBody,
            color: theme.palette.editor.blockMuted,
            fontWeight: 500,
            letterSpacing: "0.04em",
            textAlign: "center",
            ...theme.editor.blocks.interactiveFieldDense,
          })}
          onKeyDown={handleShortcuts}
        />
        <EditableContentField
          value={draft.epigraph}
          onChange={(value) => onChangeField("epigraph", value)}
          ariaLabel="Epígrafe"
          placeholder="Añade un epígrafe"
          disabled={isSaving}
          multiline
          sx={(theme: Theme) => ({
            ...theme.typography.editorBody,
            fontStyle: "italic",
            marginTop: theme.spacing(1.25),
            ...theme.editor.blocks.interactiveField,
          })}
          onKeyDown={handleShortcuts}
        />
        <EditableContentField
          value={draft.epigraphAttribution}
          onChange={(value) => onChangeField("epigraphAttribution", value)}
          ariaLabel="Atribución del epígrafe"
          placeholder="Autor o fuente"
          disabled={isSaving}
          sx={(theme: Theme) => ({
            ...theme.typography.editorBody,
            fontSize: theme.typography.caption.fontSize,
            color: theme.palette.editor.blockMuted,
            textAlign: "center",
            ...theme.editor.blocks.interactiveFieldTight,
          })}
          onKeyDown={handleShortcuts}
        />
      </Stack>
    );
  }

  if (kind === "context") {
    return (
      <EditableContentField
        value={draft.context}
        onChange={(value) => onChangeField("context", value)}
        ariaLabel="Contexto"
        placeholder="Añade notas de contexto"
        disabled={isSaving}
        multiline
        sx={(theme: Theme) => ({
          ...theme.typography.editorBody,
          fontStyle: "italic",
          color: theme.palette.editor.blockMuted,
          ...theme.editor.blocks.interactiveField,
        })}
        onKeyDown={handleShortcuts}
      />
    );
  }

  return (
    <EditableContentField
      value={draft.text}
      onChange={(value) => onChangeField("text", value)}
      ariaLabel="Contenido de metadatos"
      placeholder="Escribe el contenido"
      disabled={isSaving}
      multiline
      sx={(theme: Theme) => ({
        ...theme.typography.editorBody,
        color: theme.palette.editor.blockMuted,
        ...theme.editor.blocks.interactiveField,
      })}
      onKeyDown={handleShortcuts}
    />
  );
}
