import { useCallback, useMemo } from "react";
import { Box, Button, Fade, Modal, Stack, Typography } from "@mui/material";
import { useChapterDetail } from "../library/useChapterDetail";
import { readingTheme } from "./readingTheme";
import { PreviewChapterView } from "./PreviewChapterView";
import { usePreviewScrollbar } from "./usePreviewScrollbar";

type PreviewContainerProps = {
  chapterId: string;
  open: boolean;
  onClose: () => void;
};

export function PreviewContainer({
  chapterId,
  open,
  onClose,
}: PreviewContainerProps) {
  const targetChapterId = useMemo(
    () => (open ? chapterId : null),
    [chapterId, open],
  );
  const { chapter, loading, error, reload } = useChapterDetail(targetChapterId);
  const contentSignature = useMemo(() => {
    if (!chapter) {
      return `${chapterId}-empty`;
    }
    return `${chapter.id}:${chapter.blocks.length}`;
  }, [chapter, chapterId]);

  const { scrollAreaRef, handlers, scrollbarClassName } = usePreviewScrollbar(
    open,
    contentSignature,
  );

  const handleEditBlock = useCallback((blockId: string) => {
    void blockId;
  }, []);

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
              sx={{
                color: "grey.200",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Vista previa
            </Typography>
            <Button
              variant="text"
              color="inherit"
              onClick={onClose}
              sx={{ color: "grey.200" }}
            >
              Cerrar
            </Button>
          </Stack>
          <Box
            ref={scrollAreaRef}
            sx={readingTheme.page}
            className={scrollbarClassName}
            {...handlers}
          >
            <Box
              sx={{
                ...readingTheme.blockStack,
                fontFamily: readingTheme.typography.fontFamily,
                lineHeight: readingTheme.typography.lineHeight,
                fontSize: readingTheme.typography.fontSize,
                letterSpacing: readingTheme.typography.letterSpacing,
              }}
            >
              <PreviewChapterView
                loading={loading}
                error={error}
                chapter={chapter}
                onRetry={reload}
                onEditBlock={handleEditBlock}
              />
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}
