import { useCallback, useEffect, useMemo, useState } from "react";
import type { components } from "../../api/schema";
import { useEditorScrollbar } from "./hooks/useEditorScrollbar";
import { useEditorChapterNavigation } from "./hooks/useEditorChapterNavigation";
import { useSidebarHover } from "./hooks/useSidebarHover";
import { EditorShell } from "./EditorShell";
import { useUpdateChapterBlock } from "./hooks/useUpdateChapterBlock";

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
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState<string>("");

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

  const { updateBlock, isPending: blockUpdatePending } = useUpdateChapterBlock({
    chapterId: chapter?.id,
  });

  useEffect(() => {
    setEditingBlockId(null);
    setDraftText("");
  }, [chapter?.id]);

  const getParagraphBlock = useCallback(
    (targetId: string) => {
      if (!chapter) {
        return null;
      }
      const target = chapter.blocks.find(
        (item) => item.id === targetId && item.type === "paragraph",
      );
      return target ?? null;
    },
    [chapter],
  );

  const handleEditBlock = useCallback(
    (blockId: string) => {
      if (blockUpdatePending) {
        return;
      }

      const target = getParagraphBlock(blockId);
      if (!target) {
        return;
      }

      if (editingBlockId && editingBlockId !== blockId) {
        const current = getParagraphBlock(editingBlockId);
        if (current && draftText !== (current.text ?? "")) {
          const confirmSwitch = window.confirm(
            "¿Quieres descartar los cambios pendientes?",
          );
          if (!confirmSwitch) {
            return;
          }
        }
      }

      setEditingBlockId(blockId);
      setDraftText(target.text ?? "");
    },
    [
      blockUpdatePending,
      draftText,
      editingBlockId,
      getParagraphBlock,
    ],
  );

  const handleDraftChange = useCallback((value: string) => {
    setDraftText(value);
  }, []);

  const handleCancelEdit = useCallback(() => {
    if (!editingBlockId) {
      return;
    }

    const current = getParagraphBlock(editingBlockId);
    const originalText = current?.text ?? "";
    if (draftText !== originalText) {
      const confirmCancel = window.confirm(
        "¿Deseas descartar los cambios?",
      );
      if (!confirmCancel) {
        return;
      }
    }

    setEditingBlockId(null);
    setDraftText("");
  }, [draftText, editingBlockId, getParagraphBlock]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingBlockId || !chapter || blockUpdatePending) {
      return;
    }

    const current = getParagraphBlock(editingBlockId);
    if (!current) {
      return;
    }

    const originalText = current.text ?? "";
    if (draftText === originalText) {
      setEditingBlockId(null);
      return;
    }

    try {
      await updateBlock({
        blockId: editingBlockId,
        payload: { text: draftText },
      });
      setEditingBlockId(null);
      setDraftText("");
    } catch (error) {
      console.error("Failed to update block", error);
      window.alert("No se pudieron guardar los cambios. Intenta de nuevo.");
    }
  }, [
    blockUpdatePending,
    chapter,
    draftText,
    editingBlockId,
    getParagraphBlock,
    updateBlock,
  ]);

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

  const editingState = useMemo(
    () => ({
      blockId: editingBlockId,
      draftText,
      onChangeDraft: handleDraftChange,
      onCancel: handleCancelEdit,
      onSave: handleSaveEdit,
      isSaving: blockUpdatePending,
    }),
    [
      blockUpdatePending,
      draftText,
      editingBlockId,
      handleCancelEdit,
      handleDraftChange,
      handleSaveEdit,
    ],
  );

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
        editingState,
      }}
      scrollAreaRef={scrollAreaRef}
      scrollHandlers={handlers}
      scrollbarClassName={scrollbarClassName}
    />
  );
}
