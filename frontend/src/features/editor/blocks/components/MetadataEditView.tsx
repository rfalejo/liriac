import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import type { Theme } from "@mui/material/styles";
import { useCallback, useMemo } from "react";
import type { components } from "../../../../api/schema";
import type { MetadataEditingState, MetadataKindOption } from "../../types";
import { EditableContentField } from "./EditableContentField";
import { createEditingShortcutHandler } from "../utils/blockEditingHelpers";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type MetadataEditViewProps = {
  block: ChapterBlock;
  editingState: MetadataEditingState;
};

type KindOption = {
  value: MetadataKindOption;
  label: string;
};

const KIND_OPTIONS: KindOption[] = [
  { value: "metadata", label: "Nota" },
  { value: "context", label: "Contexto" },
  { value: "chapter_header", label: "Encabezado de capítulo" },
];

export function MetadataEditView({ block, editingState }: MetadataEditViewProps) {
  const { metadata, isSaving } = editingState;
  const { draft, onChangeField, onChangeKind } = metadata;
  const kind = metadata.kind;
  const selectLabelId = useMemo(() => `metadata-kind-label-${block.id}`, [block.id]);
  const selectId = useMemo(() => `metadata-kind-${block.id}`, [block.id]);
  const handleShortcuts = createEditingShortcutHandler(editingState);

  const handleKindChange = useCallback(
    (event: SelectChangeEvent<MetadataKindOption>) => {
      onChangeKind(event.target.value as MetadataKindOption);
    },
    [onChangeKind],
  );

  const renderChapterHeaderFields = useCallback(
    () => (
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
          autoFocus
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
    ),
    [block.ordinal, draft.epigraph, draft.epigraphAttribution, draft.subtitle, draft.title, handleShortcuts, isSaving, onChangeField],
  );

  const renderContextFields = useCallback(
    () => (
      <Stack spacing={1.25} alignItems="stretch">
        <EditableContentField
          value={draft.context}
          onChange={(value) => onChangeField("context", value)}
          ariaLabel="Contexto narrativo"
          placeholder="Notas generales del contexto"
          disabled={isSaving}
          multiline
          autoFocus
          sx={(theme: Theme) => ({
            ...theme.typography.editorBody,
            fontStyle: "italic",
            color: theme.palette.editor.blockMuted,
            ...theme.editor.blocks.interactiveField,
          })}
          onKeyDown={handleShortcuts}
        />

        <EditableContentField
          value={draft.povCharacterName}
          onChange={(value) => onChangeField("povCharacterName", value)}
          ariaLabel="Personaje en punto de vista"
          placeholder="Punto de vista"
          disabled={isSaving}
          sx={(theme: Theme) => ({
            ...theme.typography.editorBody,
            ...theme.editor.blocks.interactiveField,
            color: theme.palette.editor.blockMuted,
          })}
          onKeyDown={handleShortcuts}
        />

        <EditableContentField
          value={draft.timelineMarker}
          onChange={(value) => onChangeField("timelineMarker", value)}
          ariaLabel="Marca temporal"
          placeholder="Momento o marco temporal"
          disabled={isSaving}
          sx={(theme: Theme) => ({
            ...theme.typography.editorBody,
            ...theme.editor.blocks.interactiveField,
            color: theme.palette.editor.blockMuted,
          })}
          onKeyDown={handleShortcuts}
        />

        <EditableContentField
          value={draft.locationName}
          onChange={(value) => onChangeField("locationName", value)}
          ariaLabel="Ubicación"
          placeholder="Escenario actual"
          disabled={isSaving}
          sx={(theme: Theme) => ({
            ...theme.typography.editorBody,
            ...theme.editor.blocks.interactiveField,
            color: theme.palette.editor.blockMuted,
          })}
          onKeyDown={handleShortcuts}
        />

        <EditableContentField
          value={draft.themeTags}
          onChange={(value) => onChangeField("themeTags", value)}
          ariaLabel="Etiquetas temáticas"
          placeholder="Temas (separa con comas)"
          disabled={isSaving}
          sx={(theme: Theme) => ({
            ...theme.typography.editorBody,
            ...theme.editor.blocks.interactiveField,
            color: theme.palette.editor.blockMuted,
          })}
          onKeyDown={handleShortcuts}
        />
      </Stack>
    ),
    [draft.context, draft.locationName, draft.povCharacterName, draft.themeTags, draft.timelineMarker, handleShortcuts, isSaving, onChangeField],
  );

  const renderMetadataField = useCallback(
    () => (
      <EditableContentField
        value={draft.text}
        onChange={(value) => onChangeField("text", value)}
        ariaLabel="Contenido de metadatos"
        placeholder="Escribe el contenido"
        disabled={isSaving}
        multiline
        autoFocus
        sx={(theme: Theme) => ({
          ...theme.typography.editorBody,
          color: theme.palette.editor.blockMuted,
          ...theme.editor.blocks.interactiveField,
        })}
        onKeyDown={handleShortcuts}
      />
    ),
    [draft.text, handleShortcuts, isSaving, onChangeField],
  );

  const renderFields = useCallback(() => {
    if (kind === "chapter_header") {
      return renderChapterHeaderFields();
    }

    if (kind === "context") {
      return renderContextFields();
    }

    return renderMetadataField();
  }, [kind, renderChapterHeaderFields, renderContextFields, renderMetadataField]);

  return (
    <Stack spacing={1.5} alignItems="stretch">
      <FormControl
        size="small"
        disabled={isSaving}
        sx={{ alignSelf: "flex-start", minWidth: 220 }}
      >
        <InputLabel id={selectLabelId}>Tipo de metadatos</InputLabel>
        <Select<MetadataKindOption>
          labelId={selectLabelId}
          id={selectId}
          value={kind}
          label="Tipo de metadatos"
          onChange={handleKindChange}
        >
          {KIND_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {renderFields()}
    </Stack>
  );
}
