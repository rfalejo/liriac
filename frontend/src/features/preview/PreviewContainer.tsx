import {
  Fragment,
  type MouseEventHandler,
  type UIEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const hideScrollbarTimerRef = useRef<number | null>(null);
  const [scrollbarMode, setScrollbarMode] = useState<"hidden" | "visible">("hidden");
  const [isScrollable, setIsScrollable] = useState(false);
  const handleEditBlock = useCallback((blockId: string) => {
    void blockId;
  }, []);

  useEffect(() => {
    if (!open) {
      setScrollbarMode("hidden");
    }
  }, [open]);

  useEffect(() => {
    const node = scrollAreaRef.current;
    if (!node || !open) {
      setIsScrollable(false);
      return;
    }

    const update = () => {
      setIsScrollable(node.scrollHeight - node.clientHeight > 4);
    };

    const id = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(id);
  }, [chapter, open]);

  useEffect(() => () => {
    if (hideScrollbarTimerRef.current) {
      window.clearTimeout(hideScrollbarTimerRef.current);
      hideScrollbarTimerRef.current = null;
    }
  }, []);

  const scheduleHideScrollbar = useCallback(() => {
    if (hideScrollbarTimerRef.current) {
      window.clearTimeout(hideScrollbarTimerRef.current);
    }

    hideScrollbarTimerRef.current = window.setTimeout(() => {
      setScrollbarMode("hidden");
    }, 1500);
  }, []);

  const revealScrollbar = useCallback(() => {
    if (!isScrollable) return;
    setScrollbarMode("visible");
    scheduleHideScrollbar();
  }, [isScrollable, scheduleHideScrollbar]);

  const handleScroll = useCallback<UIEventHandler<HTMLDivElement>>(() => {
    revealScrollbar();
  }, [revealScrollbar]);

  const handlePointerEnter = useCallback<MouseEventHandler<HTMLDivElement>>(() => {
    revealScrollbar();
  }, [revealScrollbar]);

  const handlePointerLeave = useCallback<MouseEventHandler<HTMLDivElement>>(() => {
    if (!isScrollable) return;
    scheduleHideScrollbar();
  }, [isScrollable, scheduleHideScrollbar]);

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
          <Box
            ref={scrollAreaRef}
            sx={readingTheme.page}
            className={`preview-scroll-area ${
              isScrollable ? `scrollbar-${scrollbarMode}` : "scrollbar-disabled"
            }`}
            onScroll={handleScroll}
            onMouseEnter={handlePointerEnter}
            onMouseMove={handlePointerEnter}
            onMouseLeave={handlePointerLeave}
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
