import { useCallback, useEffect, useRef, useState } from "react";
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
import { generateTurnId } from "./utils/dialogueTurns";
import type { EditingDiscardContext } from "./hooks/editing/types";
import type { ChapterBlockCreatePayload } from "../../api/chapters";
import { ConfirmationDialog } from "./components/ConfirmationDialog";

type ChapterBlockType = components["schemas"]["ChapterBlockTypeEnum"];

type ConfirmDialogTone = "warning" | "danger";

type ConfirmDialogOptions = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: ConfirmDialogTone;
};

type ConfirmDialogState = ConfirmDialogOptions & {
  resolve: (decision: boolean) => void;
};

function generateBlockId(): string {
  const cryptoRef =
    typeof globalThis !== "undefined"
      ? (globalThis.crypto as Crypto | undefined)
      : undefined;
  if (cryptoRef && "randomUUID" in cryptoRef) {
    return cryptoRef.randomUUID();
  }
  return `local-block-${Math.random().toString(36).slice(2, 10)}`;
}

function buildDefaultBlockPayload(
  blockType: ChapterBlockType,
  blockId: string,
): ChapterBlockCreatePayload {
  if (blockType === "paragraph") {
    return {
      id: blockId,
      type: blockType,
      text: "",
      style: "narration",
      tags: [],
    };
  }

  if (blockType === "dialogue") {
    return {
      id: blockId,
      type: blockType,
      turns: [
        {
          id: generateTurnId(),
          speakerId: null,
          speakerName: "",
          utterance: "",
          stageDirection: null,
          tone: null,
        },
      ],
      context: null,
    };
  }

  if (blockType === "scene_boundary") {
    return {
      id: blockId,
      type: blockType,
      label: "",
      summary: "",
      locationId: null,
      locationName: null,
      timestamp: null,
      mood: null,
    };
  }

  return {
    id: blockId,
    type: "metadata",
    kind: "metadata",
    text: "",
  };
}

function attachPosition(
  payload: ChapterBlockCreatePayload,
  position: {
    afterBlockId: string | null;
    beforeBlockId: string | null;
  },
  chapter: components["schemas"]["ChapterDetail"] | null,
): ChapterBlockCreatePayload {
  if (!chapter) {
    return payload;
  }

  const blocks = chapter.blocks ?? [];

  if (position.beforeBlockId) {
    const target = blocks.find((block) => block.id === position.beforeBlockId);
    if (target && typeof target.position === "number") {
      return {
        ...payload,
        position: target.position,
      };
    }
  }

  if (position.afterBlockId) {
    const target = blocks.find((block) => block.id === position.afterBlockId);
    if (target && typeof target.position === "number") {
      return {
        ...payload,
        position: target.position + 1,
      };
    }
  }

  const maxPosition = blocks.reduce<number | null>((acc, block) => {
    if (typeof block.position !== "number") {
      return acc;
    }
    if (acc === null) {
      return block.position;
    }
    return Math.max(acc, block.position);
  }, null);

  return {
    ...payload,
    position: typeof maxPosition === "number" ? maxPosition + 1 : 0,
  };
}

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

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(
    null,
  );

  const openConfirmDialog = useCallback(
    (options: ConfirmDialogOptions) =>
      new Promise<boolean>((resolve) => {
        setConfirmDialog({
          ...options,
          resolve,
        });
      }),
    [],
  );

  const handleConfirmClose = useCallback((decision: boolean) => {
    setConfirmDialog((current) => {
      if (current) {
        current.resolve(decision);
      }
      return null;
    });
  }, []);

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
      blockType: components["schemas"]["ChapterBlockTypeEnum"],
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
