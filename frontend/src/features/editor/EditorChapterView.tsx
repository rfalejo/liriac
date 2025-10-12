import { Fragment, useMemo } from "react";
import type { ReactNode } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import type { ChapterDetail } from "../../api/chapters";
import type { components } from "../../api/schema";
import {
  DialogueBlock,
  MetadataBlock,
  ParagraphBlock,
  SceneBoundaryBlock,
} from "./blocks";
import { editorTheme, editorThemeConstants } from "./editorTheme";
import {
  BlockInsertMenu,
  type BlockInsertPosition,
} from "./blocks/BlockInsertMenu";
import type { ChapterBlock, EditingState } from "./types";

type ChapterBlockType = components["schemas"]["ChapterBlockTypeEnum"];

type EditorChapterViewProps = {
  loading: boolean;
  error: Error | null;
  chapter: ChapterDetail | null;
  onRetry: () => void;
  onEditBlock: (blockId: string) => void;
  onInsertBlock?: (
    blockType: ChapterBlockType,
    position: BlockInsertPosition,
  ) => void;
  editingState?: EditingState;
};

function renderFallbackBlock(block: ChapterBlock) {
  return (
    <Box
      key={block.id}
      sx={{
        border: "1px dashed rgba(27, 27, 27, 0.25)",
        borderRadius: 1,
        p: { xs: 2, sm: 3 },
        fontStyle: "italic",
        color: editorThemeConstants.mutedColor,
      }}
    >
      Bloque "{block.type}" pendiente de diseño.
    </Box>
  );
}

export function EditorChapterView({
  loading,
  error,
  chapter,
  onRetry,
  onEditBlock,
  onInsertBlock,
  editingState,
}: EditorChapterViewProps) {
  const paragraphEditing =
    editingState?.blockType === "paragraph" ? editingState : undefined;
  const dialogueEditing =
    editingState?.blockType === "dialogue" ? editingState : undefined;

  const blockSequence = useMemo(() => {
    if (!chapter) {
      return [] as Array<{ id: string; node: ReactNode }>;
    }

    const entries: Array<{ id: string; node: ReactNode }> = [];

    chapter.blocks.forEach((block) => {
      if (block.type === "paragraph") {
        const isEditing = paragraphEditing?.blockId === block.id;
        const paragraphDraft = paragraphEditing?.paragraph;
        entries.push({
          id: block.id,
          node: (
            <ParagraphBlock
              block={block}
              onEdit={onEditBlock}
              isEditing={isEditing}
              draftText={isEditing ? (paragraphDraft?.draftText ?? "") : ""}
              onDraftChange={
                isEditing ? paragraphDraft?.onChangeDraft : undefined
              }
              onCancelEdit={isEditing ? paragraphEditing?.onCancel : undefined}
              onSaveEdit={isEditing ? paragraphEditing?.onSave : undefined}
              disabled={editingState?.isSaving ?? false}
            />
          ),
        });
        return;
      }

      if (block.type === "dialogue") {
        const isEditing = dialogueEditing?.blockId === block.id;
        const dialogueDraft = dialogueEditing?.dialogue;
        entries.push({
          id: block.id,
          node: (
            <DialogueBlock
              block={block}
              onEdit={onEditBlock}
              isEditing={isEditing}
              draftTurns={
                isEditing ? (dialogueDraft?.turns ?? []) : (block.turns ?? [])
              }
              onChangeTurn={isEditing ? dialogueDraft?.onChangeTurn : undefined}
              onAddTurn={isEditing ? dialogueDraft?.onAddTurn : undefined}
              onRemoveTurn={isEditing ? dialogueDraft?.onRemoveTurn : undefined}
              onCancelEdit={isEditing ? dialogueEditing?.onCancel : undefined}
              onSaveEdit={isEditing ? dialogueEditing?.onSave : undefined}
              disabled={editingState?.isSaving ?? false}
            />
          ),
        });
        return;
      }

      if (block.type === "scene_boundary") {
        entries.push({
          id: block.id,
          node: <SceneBoundaryBlock block={block} onEdit={onEditBlock} />,
        });
        return;
      }

      if (block.type === "metadata") {
        const node = <MetadataBlock block={block} onEdit={onEditBlock} />;
        if (node) {
          entries.push({ id: block.id, node });
        }
        return;
      }

      entries.push({ id: block.id, node: renderFallbackBlock(block) });
    });

    return entries;
  }, [
    chapter,
    onEditBlock,
    editingState?.isSaving,
    paragraphEditing?.blockId,
    paragraphEditing?.paragraph?.draftText,
    paragraphEditing?.paragraph?.onChangeDraft,
    paragraphEditing?.onCancel,
    paragraphEditing?.onSave,
    dialogueEditing?.blockId,
    dialogueEditing?.dialogue?.turns,
    dialogueEditing?.dialogue?.onChangeTurn,
    dialogueEditing?.dialogue?.onAddTurn,
    dialogueEditing?.dialogue?.onRemoveTurn,
    dialogueEditing?.onCancel,
    dialogueEditing?.onSave,
  ]);

  if (loading) {
    return (
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress size={24} color="inherit" />
        <Typography
          component="span"
          sx={{ color: editorThemeConstants.mutedColor }}
        >
          Cargando capítulo...
        </Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack spacing={2} alignItems="center" textAlign="center">
        <Typography color="error.main">
          No se pudo cargar el capítulo.
        </Typography>
        <Button variant="outlined" onClick={onRetry}>
          Reintentar
        </Button>
      </Stack>
    );
  }

  if (!chapter) {
    return null;
  }

  const hasChapterHeader = chapter.blocks.some(
    (block) =>
      block.type === "metadata" &&
      (block.kind ?? "metadata") === "chapter_header",
  );

  return (
    <Fragment>
      {!hasChapterHeader && (
        <Stack spacing={1.25} sx={{ mb: 1.75 }}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: editorTheme.typography.fontFamily,
              color: editorThemeConstants.headingColor,
            }}
          >
            {chapter.title}
          </Typography>
          {chapter.summary && (
            <Typography
              variant="subtitle1"
              sx={{ color: editorThemeConstants.mutedColor }}
            >
              {chapter.summary}
            </Typography>
          )}
        </Stack>
      )}

      {blockSequence.length === 0 ? (
        <Typography
          variant="body2"
          sx={{ color: editorThemeConstants.mutedColor }}
        >
          Sin contenido.
        </Typography>
      ) : (
        <Stack spacing={0}>
          {blockSequence.map((entry, index) => {
            const previous = blockSequence[index - 1];
            const insertPosition: BlockInsertPosition = {
              afterBlockId: previous?.id ?? null,
              beforeBlockId: entry.id,
              index,
            };

            return (
              <Fragment key={entry.id}>
                {index > 0 && (
                  <BlockInsertMenu
                    position={insertPosition}
                    onInsertBlock={onInsertBlock}
                  />
                )}
                {entry.node}
              </Fragment>
            );
          })}
        </Stack>
      )}
    </Fragment>
  );
}
