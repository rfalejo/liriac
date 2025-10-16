import { useCallback, useEffect, useRef } from "react";
import type { ChapterDetail } from "../../../api/chapters";
import type { components } from "../../../api/schema";
import { useCreateChapterBlock } from "./useCreateChapterBlock";
import { useDeleteChapterBlock } from "./useDeleteChapterBlock";
import {
  useEditorConfirmDialog,
  type ConfirmDialogState,
} from "./useEditorConfirmDialog";
import { useEditorEditingState } from "./useEditorEditingState";
import { useUpdateChapterBlock } from "./useUpdateChapterBlock";
import type { EditingDiscardContext } from "./editing/types";
import {
  attachPosition,
  buildDefaultBlockPayload,
  generateBlockId,
} from "../utils/blockCreation";
import { showBlockUpdateErrorToast } from "../utils/showBlockUpdateErrorToast";
import type { BlockInsertPosition } from "../blocks/BlockInsertMenu";

type ChapterBlockType = components["schemas"]["ChapterBlockTypeEnum"];

type UseEditorBlockOperationsParams = {
  chapter: ChapterDetail | null;
};

type UseEditorBlockOperationsResult = {
  editingState?: ReturnType<typeof useEditorEditingState>["editingState"];
  handleEditBlock: ReturnType<typeof useEditorEditingState>["handleEditBlock"];
  handleInsertBlock: (
    blockType: ChapterBlockType,
    position: BlockInsertPosition,
  ) => void;
  confirmDialog: ConfirmDialogState | null;
  handleConfirmClose: (decision: boolean) => void;
  mutationPending: boolean;
};

export function useEditorBlockOperations({
  chapter,
}: UseEditorBlockOperationsParams): UseEditorBlockOperationsResult {
  const chapterId = chapter?.id ?? null;

  const { dialogState, openConfirmDialog, resolveDialog } =
    useEditorConfirmDialog();

  const { updateBlock, isPending: blockUpdatePending } = useUpdateChapterBlock({
    chapterId,
  });

  const { createBlock, isPending: blockCreatePending } = useCreateChapterBlock({
    chapterId,
  });

  const { deleteBlock, isPending: blockDeletePending } = useDeleteChapterBlock({
    chapterId,
  });

  const blockMutationPending = blockUpdatePending || blockCreatePending;
  const mutationPending = blockMutationPending || blockDeletePending;

  const handleConfirmClose = useCallback(
    (decision: boolean) => {
      resolveDialog(decision);
    },
    [resolveDialog],
  );

  const confirmDiscardChanges = useCallback(
    (context: EditingDiscardContext) => {
      return openConfirmDialog(
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
            },
      );
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

  const confirmDeleteBlockVersion = useCallback(
    () =>
      openConfirmDialog({
        title: "Eliminar versión",
        description:
          "¿Quieres eliminar esta versión del bloque? No podrás deshacer esta acción.",
        confirmLabel: "Eliminar versión",
        cancelLabel: "Cancelar",
        tone: "danger",
      }),
    [openConfirmDialog],
  );

  const notifyUpdateFailure = useCallback((error: unknown) => {
    showBlockUpdateErrorToast(error);
  }, []);

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
      confirmDeleteBlockVersion,
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
      position: BlockInsertPosition,
    ) => {
      if (!chapterId || mutationPending) {
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
    [chapter, chapterId, createBlock, mutationPending, notifyUpdateFailure],
  );

  return {
    editingState,
    handleEditBlock,
    handleInsertBlock,
    confirmDialog: dialogState,
    handleConfirmClose,
    mutationPending,
  } satisfies UseEditorBlockOperationsResult;
}
