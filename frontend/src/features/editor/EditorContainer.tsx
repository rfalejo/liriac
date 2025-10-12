import { useCallback } from "react";
import type { components } from "../../api/schema";
import { useEditorScrollbar } from "./useEditorScrollbar";
import { useEditorChapterNavigation } from "./useEditorChapterNavigation";
import { useSidebarHover } from "./useSidebarHover";
import { EditorShell } from "./EditorShell";

type EditorContainerProps = {
  chapterId: string;
  open: boolean;
  onClose: () => void;
};

export function EditorContainer({
  chapterId,
  open,
  onClose,
}: EditorContainerProps) {
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
  } = useEditorChapterNavigation({ chapterId });

  const { scrollAreaRef, handlers, scrollbarClassName } = useEditorScrollbar(
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
    <EditorShell
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
