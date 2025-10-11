import { Fragment, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Fade,
  Modal,
  Stack,
  Typography,
} from "@mui/material";
import { useChapterDetail } from "../library/useChapterDetail";
import { DialogueBlock, MetadataBlock, ParagraphBlock, SceneBoundaryBlock } from "./blocks";
import { readingTheme, readingThemeConstants } from "./readingTheme";

type PreviewContainerProps = {
  chapterId: string;
  open: boolean;
  onClose: () => void;
};

export function PreviewContainer({ chapterId, open, onClose }: PreviewContainerProps) {
  const targetChapterId = useMemo(() => (open ? chapterId : null), [chapterId, open]);
  const { chapter, loading, error, reload } = useChapterDetail(targetChapterId);
  const handleEditBlock = useCallback((blockId: string) => {
    void blockId;
  }, []);

  const renderedBlocks = useMemo(() => {
    if (!chapter) {
      return [];
    }

    return chapter.blocks.flatMap((block) => {
      if (block.type === "paragraph") {
        return [
          <ParagraphBlock key={block.id} block={block} onEdit={handleEditBlock} />,
        ];
      }

      if (block.type === "dialogue") {
        return [
          <DialogueBlock key={block.id} block={block} onEdit={handleEditBlock} />,
        ];
      }

      if (block.type === "scene_boundary") {
        return [
          <SceneBoundaryBlock key={block.id} block={block} onEdit={handleEditBlock} />,
        ];
      }

      if (block.type === "metadata") {
        const node = (
          <MetadataBlock key={block.id} block={block} onEdit={handleEditBlock} />
        );
        return node ? [node] : [];
      }

      return [
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
        </Box>,
      ];
    });
  }, [chapter, handleEditBlock]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      aria-labelledby="preview-container-heading"
    >
      <Fade in={open}>
        <Box sx={readingTheme.shell}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 } }}
          >
            <Typography
              id="preview-container-heading"
              variant="subtitle1"
              sx={{ color: "grey.200", letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              Vista previa
            </Typography>
            <Button variant="text" color="inherit" onClick={onClose} sx={{ color: "grey.200" }}>
              Cerrar
            </Button>
          </Stack>

          <Box sx={readingTheme.page}>
            <Box
              sx={{
                ...readingTheme.blockStack,
                fontFamily: readingTheme.typography.fontFamily,
                lineHeight: readingTheme.typography.lineHeight,
                fontSize: readingTheme.typography.fontSize,
                letterSpacing: readingTheme.typography.letterSpacing,
              }}
            >
              {loading && (
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                  <CircularProgress size={24} color="inherit" />
                  <Typography component="span" sx={{ color: readingThemeConstants.mutedColor }}>
                    Cargando vista previa...
                  </Typography>
                </Stack>
              )}

              {!loading && error && (
                <Stack spacing={2} alignItems="center" textAlign="center">
                  <Typography color="error.main">No se pudo cargar el capítulo.</Typography>
                  <Button variant="outlined" onClick={reload}>
                    Reintentar
                  </Button>
                </Stack>
              )}

              {!loading && !error && chapter && (
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
                      <Typography
                        variant="subtitle1"
                        sx={{ color: readingThemeConstants.mutedColor }}
                      >
                        {chapter.summary}
                      </Typography>
                    )}
                  </Stack>

                  {renderedBlocks.length === 0 ? (
                    <Typography
                      variant="body2"
                      sx={{ color: readingThemeConstants.mutedColor }}
                    >
                      Sin contenido.
                    </Typography>
                  ) : (
                    <Stack spacing={{ xs: 3, sm: 4 }}>{renderedBlocks}</Stack>
                  )}
                </Fragment>
              )}
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}
