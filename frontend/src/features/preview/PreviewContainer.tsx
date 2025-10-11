import { useCallback } from "react";
import { Box, Fade, Modal } from "@mui/material";
import { readingTheme } from "./readingTheme";
import { PreviewChapterView } from "./PreviewChapterView";
import { usePreviewScrollbar } from "./usePreviewScrollbar";
import { usePreviewChapterNavigation } from "./usePreviewChapterNavigation";
import { useSidebarHover } from "./useSidebarHover";
import { PreviewSidebar } from "./PreviewSidebar";

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
  const {
    activeChapterId,
    chapter,
    chapterOptions,
    booksError,
    booksLoading,
    bookTitle,
    contentSignature,
    error,
    handleSelectChapter,
    loading,
    reload,
  } = usePreviewChapterNavigation({ chapterId, open });

  const { scrollAreaRef, handlers, scrollbarClassName } = usePreviewScrollbar(
    open,
    contentSignature,
  );

  const handleEditBlock = useCallback((blockId: string) => {
    void blockId;
  }, []);
  const { sidebarVisible, handleSidebarEnter, handleSidebarLeave } =
    useSidebarHover({ open });

  const selectedChapterId = chapter?.id ?? activeChapterId;

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      aria-labelledby="preview-container-heading"
    >
      <Fade in={open}>
        <Box sx={readingTheme.shell}>
          <PreviewSidebar
            activeChapterId={selectedChapterId}
            bookTitle={bookTitle}
            chapters={chapterOptions}
            error={booksError}
            loading={booksLoading}
            onClose={onClose}
            onEnter={handleSidebarEnter}
            onLeave={handleSidebarLeave}
            onSelectChapter={handleSelectChapter}
            visible={sidebarVisible}
          />
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
