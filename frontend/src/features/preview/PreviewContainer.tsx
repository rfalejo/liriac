import { useCallback } from "react";
import type { components } from "../../api/schema";
import { usePreviewScrollbar } from "./usePreviewScrollbar";
import { usePreviewChapterNavigation } from "./usePreviewChapterNavigation";
import { useSidebarHover } from "./useSidebarHover";
import { PreviewModal } from "./PreviewModal";

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

  const handleInsertBlock = useCallback(
    (
      blockType: components["schemas"]["ChapterBlockTypeEnum"],
      position: {
        afterBlockId: string | null;
        beforeBlockId: string | null;
        index: number;
      },
    ) => {
      void blockType;
      void position;
    },
    [],
  );
  const { sidebarVisible, handleSidebarEnter, handleSidebarLeave } =
    useSidebarHover({ open });

  const selectedChapterId = chapter?.id ?? activeChapterId;

  return (
    <PreviewModal
      open={open}
      onClose={onClose}
      sidebarProps={{
        activeChapterId: selectedChapterId,
        bookTitle,
        chapters: chapterOptions,
        error: booksError,
        loading: booksLoading,
        onClose,
        onEnter: handleSidebarEnter,
        onLeave: handleSidebarLeave,
        onSelectChapter: handleSelectChapter,
        visible: sidebarVisible,
      }}
      chapterViewProps={{
        loading,
        error,
        chapter,
        onRetry: reload,
        onEditBlock: handleEditBlock,
        onInsertBlock: handleInsertBlock,
      }}
      scrollAreaRef={scrollAreaRef}
      scrollHandlers={handlers}
      scrollbarClassName={scrollbarClassName}
    />
  );
}
