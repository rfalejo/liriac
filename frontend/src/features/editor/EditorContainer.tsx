import { useCallback, useEffect, useRef } from "react";
import type { components } from "../../api/schema";
import { useEditorScrollbar } from "./hooks/useEditorScrollbar";
import { useEditorChapterNavigation } from "./hooks/useEditorChapterNavigation";
import { useSidebarHover } from "./hooks/useSidebarHover";
import { EditorShell } from "./EditorShell";
import { useUpdateChapterBlock } from "./hooks/useUpdateChapterBlock";
import { useCreateChapterBlock } from "./hooks/useCreateChapterBlock";
import { useEditorEditingState } from "./hooks/useEditorEditingState";
import { useDeleteChapterBlock } from "./hooks/useDeleteChapterBlock";
import { showBlockUpdateErrorToast } from "./utils/showBlockUpdateErrorToast";
import type { EditingDiscardContext } from "./hooks/editing/types";
import { ConfirmationDialog } from "./components/ConfirmationDialog";
import {
  useEditorConfirmDialog,
  type ConfirmDialogOptions,
} from "./hooks/useEditorConfirmDialog";
import {
  attachPosition,
  buildDefaultBlockPayload,
  generateBlockId,
} from "./utils/blockCreation";

type ChapterBlockType = components["schemas"]["ChapterBlockTypeEnum"];


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

  const { scrollAreaRef, handlers, scrollbarState } = useEditorScrollbar(
    open,
    contentSignature,
  );

  const { updateBlock, isPending: blockUpdatePending } = useUpdateChapterBlock({
    chapterId: chapter?.id,
  });

  const { createBlock, isPending: blockCreatePending } = useCreateChapterBlock({
    chapterId: chapter?.id,
  });

  const { deleteBlock, isPending: blockDeletePending } = useDeleteChapterBlock({
    chapterId: chapter?.id,
  });

  const { dialogState: confirmDialog, openConfirmDialog, resolveDialog } =
    useEditorConfirmDialog();

  const handleConfirmClose = useCallback(
    (decision: boolean) => {
      resolveDialog(decision);
    },
    [resolveDialog],
  );

  const confirmDiscardChanges = useCallback(
    (context: EditingDiscardContext) => {
      const options: ConfirmDialogOptions =
        context === "cancel"
          ? {
              title: "Descartar cambios",
              description:
                "Tienes cambios sin guardar en este bloque. ¿Quieres descartarlos?",
              confirmLabel: "Descartar cambios",
              cancelLabel: "Seguir editando",
              tone: "warning",
            }
          : {
              title: "Cambiar de bloque",
              description:
                "Tienes cambios sin guardar. ¿Quieres descartarlos y cambiar de bloque?",
              confirmLabel: "Cambiar y descartar",
              cancelLabel: "Seguir editando",
              tone: "warning",
            };

      return openConfirmDialog(options);
    },
    [openConfirmDialog],
  );

  const confirmDeleteBlock = useCallback(
    () =>
      openConfirmDialog({
        title: "Eliminar bloque",
        description:
          "¿Quieres eliminar este bloque? No podrás deshacer esta acción.",
        confirmLabel: "Eliminar bloque",
        cancelLabel: "Cancelar",
        tone: "danger",
      }),
    [openConfirmDialog],
  );

  const notifyUpdateFailure = useCallback((error: unknown) => {
    showBlockUpdateErrorToast(error);
  }, []);

  const blockMutationPending = blockUpdatePending || blockCreatePending;
  const mutationPending = blockMutationPending || blockDeletePending;

  const deleteBlockById = useCallback(
    (blockId: string) => deleteBlock({ blockId }),
    [deleteBlock],
  );

  const { editingState, handleEditBlock } = useEditorEditingState({
    chapter,
    updateBlock,
    deleteBlock: deleteBlockById,
    blockUpdatePending: blockMutationPending,
    blockDeletePending,
    sideEffects: {
      confirmDiscardChanges,
      confirmDeleteBlock,
      notifyUpdateFailure,
    },
  });

  const handleEditBlockRef = useRef(handleEditBlock);

  useEffect(() => {
    handleEditBlockRef.current = handleEditBlock;
  }, [handleEditBlock]);

  const handleInsertBlock = useCallback(
    (
      blockType: ChapterBlockType,
      position: {
        afterBlockId: string | null;
        beforeBlockId: string | null;
        index: number;
      },
    ) => {
      if (!chapter?.id || mutationPending) {
        return;
      }

      const blockId = generateBlockId();
      const payload = attachPosition(
        buildDefaultBlockPayload(blockType, blockId),
        position,
        chapter,
      );

      createBlock({ payload })
        .then(() => {
          setTimeout(() => {
            handleEditBlockRef.current(blockId);
          }, 0);
        })
        .catch((error) => {
          notifyUpdateFailure(error);
        });
    },
    [chapter, createBlock, mutationPending, notifyUpdateFailure],
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
        editingState,
      }}
      scrollAreaRef={scrollAreaRef}
      scrollHandlers={handlers}
      scrollbarState={scrollbarState}
    >
      <ConfirmationDialog
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title ?? ""}
        description={confirmDialog?.description ?? ""}
        confirmLabel={confirmDialog?.confirmLabel ?? ""}
        cancelLabel={confirmDialog?.cancelLabel ?? ""}
        tone={confirmDialog?.tone ?? "warning"}
        confirmDisabled={mutationPending}
        onClose={handleConfirmClose}
      />
    </EditorShell>
  );
}
