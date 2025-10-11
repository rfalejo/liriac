import { Fragment, useMemo } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import type { ChapterDetail } from "../../api/chapters";
import type { components } from "../../api/schema";
import { DialogueBlock, MetadataBlock, ParagraphBlock, SceneBoundaryBlock } from "./blocks";
import { readingTheme, readingThemeConstants } from "./readingTheme";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type PreviewChapterViewProps = {
  loading: boolean;
  error: Error | null;
  chapter: ChapterDetail | null;
  onRetry: () => void;
  onEditBlock: (blockId: string) => void;
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
        color: readingThemeConstants.mutedColor,
      }}
    >
      Bloque "{block.type}" pendiente de diseño.
    </Box>
  );
}

export function PreviewChapterView({
  loading,
  error,
  chapter,
  onRetry,
  onEditBlock,
}: PreviewChapterViewProps) {
  const renderedBlocks = useMemo(() => {
    if (!chapter) {
      return [];
    }

    return chapter.blocks.flatMap((block) => {
      if (block.type === "paragraph") {
        return [<ParagraphBlock key={block.id} block={block} onEdit={onEditBlock} />];
      }

      if (block.type === "dialogue") {
        return [<DialogueBlock key={block.id} block={block} onEdit={onEditBlock} />];
      }

      if (block.type === "scene_boundary") {
        return [
          <SceneBoundaryBlock key={block.id} block={block} onEdit={onEditBlock} />,
        ];
      }

      if (block.type === "metadata") {
        const node = <MetadataBlock key={block.id} block={block} onEdit={onEditBlock} />;
        return node ? [node] : [];
      }

      return [renderFallbackBlock(block)];
    });
  }, [chapter, onEditBlock]);

  if (loading) {
    return (
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
        <CircularProgress size={24} color="inherit" />
        <Typography component="span" sx={{ color: readingThemeConstants.mutedColor }}>
          Cargando vista previa...
        </Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack spacing={2} alignItems="center" textAlign="center">
        <Typography color="error.main">No se pudo cargar el capítulo.</Typography>
        <Button variant="outlined" onClick={onRetry}>
          Reintentar
        </Button>
      </Stack>
    );
  }

  if (!chapter) {
    return null;
  }

  return (
    <Fragment>
      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: readingTheme.typography.fontFamily,
            color: readingThemeConstants.headingColor,
          }}
        >
          {chapter.title}
        </Typography>
        {chapter.summary && (
          <Typography variant="subtitle1" sx={{ color: readingThemeConstants.mutedColor }}>
            {chapter.summary}
          </Typography>
        )}
      </Stack>
      {renderedBlocks.length === 0 ? (
        <Typography variant="body2" sx={{ color: readingThemeConstants.mutedColor }}>
          Sin contenido.
        </Typography>
      ) : (
        <Stack spacing={{ xs: 3, sm: 4 }}>{renderedBlocks}</Stack>
      )}
    </Fragment>
  );
}
