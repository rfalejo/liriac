import { Fragment, useMemo } from "react";
import type { ReactNode } from "react";
import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import type { ChapterDetail } from "../../api/chapters";
import type { components } from "../../api/schema";
import {
  editorBodyTypographySx,
  editorFontFamily,
  editorTheme,
  editorThemeConstants,
} from "./editorTheme";
import {
  BlockInsertMenu,
  type BlockInsertPosition,
} from "./blocks/BlockInsertMenu";
import type { EditingState } from "./types";
import { renderEditorBlock } from "./blocks/blockRegistry";

type ChapterBlockType = components["schemas"]["ChapterBlockTypeEnum"];

type BlockEntry = { id: string; node: ReactNode };

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

export function EditorChapterView({
  loading,
  error,
  chapter,
  onRetry,
  onEditBlock,
  onInsertBlock,
  editingState,
}: EditorChapterViewProps) {
  const blockSequence = useMemo(() => {
    if (!chapter) {
      return [] as BlockEntry[];
    }

    return chapter.blocks.reduce<BlockEntry[]>((entries, block) => {
      const rendered = renderEditorBlock({
        block,
        editingState,
        onEditBlock,
      });

      if (rendered) {
        entries.push({ id: block.id, node: rendered });
      }

      return entries;
    }, []);
  }, [chapter, editingState, onEditBlock]);

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
          sx={{
            ...editorBodyTypographySx,
            color: editorThemeConstants.mutedColor,
          }}
        >
          Cargando capítulo...
        </Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack spacing={2} alignItems="center" textAlign="center">
        <Typography
          sx={{
            ...editorBodyTypographySx,
            color: "error.main",
          }}
        >
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
              sx={{
                fontFamily: editorFontFamily,
                color: editorThemeConstants.mutedColor,
              }}
            >
              {chapter.summary}
            </Typography>
          )}
        </Stack>
      )}

      {blockSequence.length === 0 ? (
        <Typography
          variant="body2"
          sx={{
            ...editorBodyTypographySx,
            color: editorThemeConstants.mutedColor,
          }}
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
