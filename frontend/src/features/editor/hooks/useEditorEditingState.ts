import { useCallback, useMemo } from "react";
import type {
  ChapterBlockUpdatePayload,
  ChapterDetail,
} from "../../../api/chapters";
import type { ChapterBlock, EditingState } from "../types";
import { useChapterBlockSelectors } from "./useChapterBlockSelectors";
import type { EditorEditingSideEffects } from "./editing/types";
import { useDialogueBlockEditingSession } from "./editing/useDialogueBlockEditingSession";
import { useEditingBlockManager } from "./editing/useEditingBlockManager";
import { useMetadataBlockEditingSession } from "./editing/useMetadataBlockEditingSession";
import { useParagraphBlockEditingSession } from "./editing/useParagraphBlockEditingSession";
import { useSceneBoundaryBlockEditingSession } from "./editing/useSceneBoundaryBlockEditingSession";

export type UseEditorEditingStateParams = {
  chapter: ChapterDetail | null;
  updateBlock: (args: {
    blockId: string;
    payload: ChapterBlockUpdatePayload;
  }) => Promise<ChapterDetail>;
  deleteBlock: (blockId: string) => Promise<ChapterDetail>;
  blockUpdatePending: boolean;
  blockDeletePending: boolean;
  sideEffects: EditorEditingSideEffects;
};

type UseEditorEditingStateResult = {
  editingState?: EditingState;
  handleEditBlock: (blockId: string) => void;
};

export function useEditorEditingState({
  chapter,
  updateBlock,
  deleteBlock,
  blockUpdatePending,
  blockDeletePending,
  sideEffects,
}: UseEditorEditingStateParams): UseEditorEditingStateResult {
  const { getBlockById } = useChapterBlockSelectors(chapter);
  const {
    activeBlockId,
    attemptCancelEditing,
    attemptStartEditing,
    clearEditing,
  } = useEditingBlockManager({
    chapterId: chapter?.id ?? null,
    getBlockById,
    confirmDiscardChanges: sideEffects.confirmDiscardChanges,
  });

  const activeBlock = useMemo(() => {
    if (!activeBlockId) {
      return null;
    }
    return getBlockById(activeBlockId);
  }, [activeBlockId, getBlockById]);

  const activeParagraphBlock =
    activeBlock?.type === "paragraph"
      ? (activeBlock as ChapterBlock & { type: "paragraph" })
      : null;

  const activeDialogueBlock =
    activeBlock?.type === "dialogue"
      ? (activeBlock as ChapterBlock & { type: "dialogue" })
      : null;

  const activeSceneBoundaryBlock =
    activeBlock?.type === "scene_boundary"
      ? (activeBlock as ChapterBlock & { type: "scene_boundary" })
      : null;

  const activeMetadataBlock =
    activeBlock?.type === "metadata"
      ? (activeBlock as ChapterBlock & { type: "metadata" })
      : null;

  const blockMutationPending = blockUpdatePending || blockDeletePending;

  const paragraphSession = useParagraphBlockEditingSession({
    block: activeParagraphBlock,
    isActive: Boolean(activeParagraphBlock),
    isSaving: blockMutationPending,
    updateBlock,
    onComplete: clearEditing,
    sideEffects: {
      notifyUpdateFailure: sideEffects.notifyUpdateFailure,
    },
  });

  const dialogueSession = useDialogueBlockEditingSession({
    block: activeDialogueBlock,
    isActive: Boolean(activeDialogueBlock),
    isSaving: blockMutationPending,
    updateBlock,
    onComplete: clearEditing,
    sideEffects: {
      notifyUpdateFailure: sideEffects.notifyUpdateFailure,
    },
  });

  const sceneBoundarySession = useSceneBoundaryBlockEditingSession({
    block: activeSceneBoundaryBlock,
    isActive: Boolean(activeSceneBoundaryBlock),
    isSaving: blockMutationPending,
    updateBlock,
    onComplete: clearEditing,
    sideEffects: {
      notifyUpdateFailure: sideEffects.notifyUpdateFailure,
    },
  });

  const metadataSession = useMetadataBlockEditingSession({
    block: activeMetadataBlock,
    isActive: Boolean(activeMetadataBlock),
    isSaving: blockMutationPending,
    updateBlock,
    onComplete: clearEditing,
    sideEffects: {
      notifyUpdateFailure: sideEffects.notifyUpdateFailure,
    },
  });

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      if (blockUpdatePending || blockDeletePending) {
        return;
      }

      const performDelete = async () => {
        const confirmed = await sideEffects.confirmDeleteBlock();
        if (!confirmed) {
          return;
        }

        try {
          await deleteBlock(blockId);
          clearEditing();
        } catch (error) {
          sideEffects.notifyUpdateFailure(error);
        }
      };

      void performDelete();
    },
    [
      blockDeletePending,
      blockUpdatePending,
      clearEditing,
      deleteBlock,
      sideEffects,
    ],
  );

  type ActiveSession = {
    hasPendingChanges: boolean;
    editingState?: EditingState;
  };

  const activeSession = useMemo<ActiveSession>(() => {
    if (activeParagraphBlock) {
      return {
        hasPendingChanges: paragraphSession.hasPendingChanges,
        editingState: {
          blockId: activeParagraphBlock.id,
          blockType: "paragraph" as const,
          paragraph: {
            draftText: paragraphSession.draftText,
            onChangeDraft: paragraphSession.onChangeDraft,
          },
          onCancel: () => {
            attemptCancelEditing(paragraphSession.hasPendingChanges);
          },
          onSave: () => {
            if (blockMutationPending) {
              return;
            }
            void paragraphSession.save();
          },
          onDelete: () => {
            handleDeleteBlock(activeParagraphBlock.id);
          },
          isSaving: blockMutationPending,
          hasPendingChanges: paragraphSession.hasPendingChanges,
        },
      };
    }

    if (activeDialogueBlock) {
      return {
        hasPendingChanges: dialogueSession.hasPendingChanges,
        editingState: {
          blockId: activeDialogueBlock.id,
          blockType: "dialogue" as const,
          dialogue: {
            turns: dialogueSession.turns,
            onChangeTurn: dialogueSession.onChangeTurn,
            onAddTurn: dialogueSession.onAddTurn,
            onRemoveTurn: dialogueSession.onRemoveTurn,
          },
          onCancel: () => {
            attemptCancelEditing(dialogueSession.hasPendingChanges);
          },
          onSave: () => {
            if (blockMutationPending) {
              return;
            }
            void dialogueSession.save();
          },
          onDelete: () => {
            handleDeleteBlock(activeDialogueBlock.id);
          },
          isSaving: blockMutationPending,
          hasPendingChanges: dialogueSession.hasPendingChanges,
        },
      };
    }

    if (activeSceneBoundaryBlock) {
      return {
        hasPendingChanges: sceneBoundarySession.hasPendingChanges,
        editingState: {
          blockId: activeSceneBoundaryBlock.id,
          blockType: "scene_boundary" as const,
          sceneBoundary: {
            draft: sceneBoundarySession.draft,
            onChangeField: sceneBoundarySession.onChangeField,
          },
          onCancel: () => {
            attemptCancelEditing(sceneBoundarySession.hasPendingChanges);
          },
          onSave: () => {
            if (blockMutationPending) {
              return;
            }
            void sceneBoundarySession.save();
          },
          onDelete: () => {
            handleDeleteBlock(activeSceneBoundaryBlock.id);
          },
          isSaving: blockMutationPending,
          hasPendingChanges: sceneBoundarySession.hasPendingChanges,
        },
      };
    }

    if (activeMetadataBlock) {
      return {
        hasPendingChanges: metadataSession.hasPendingChanges,
        editingState: {
          blockId: activeMetadataBlock.id,
          blockType: "metadata" as const,
          metadata: {
            kind: metadataSession.kind,
            draft: metadataSession.draft,
            onChangeField: metadataSession.onChangeField,
            onChangeKind: metadataSession.onChangeKind,
          },
          onCancel: () => {
            attemptCancelEditing(metadataSession.hasPendingChanges);
          },
          onSave: () => {
            if (blockMutationPending) {
              return;
            }
            void metadataSession.save();
          },
          onDelete: () => {
            handleDeleteBlock(activeMetadataBlock.id);
          },
          isSaving: blockMutationPending,
          hasPendingChanges: metadataSession.hasPendingChanges,
        },
      };
    }

    return {
      hasPendingChanges: false,
      editingState: undefined,
    };
  }, [
    activeParagraphBlock,
    activeDialogueBlock,
    activeSceneBoundaryBlock,
    activeMetadataBlock,
    attemptCancelEditing,
    blockUpdatePending,
  blockMutationPending,
    dialogueSession.hasPendingChanges,
    dialogueSession.onAddTurn,
    dialogueSession.onChangeTurn,
    dialogueSession.onRemoveTurn,
    dialogueSession.save,
    dialogueSession.turns,
  handleDeleteBlock,
    metadataSession.draft,
    metadataSession.hasPendingChanges,
  metadataSession.kind,
    metadataSession.onChangeField,
  metadataSession.onChangeKind,
    metadataSession.save,
    paragraphSession.draftText,
    paragraphSession.hasPendingChanges,
    paragraphSession.onChangeDraft,
    paragraphSession.save,
    sceneBoundarySession.draft,
    sceneBoundarySession.hasPendingChanges,
    sceneBoundarySession.onChangeField,
    sceneBoundarySession.save,
  ]);

  const handleEditBlock = useCallback(
    (blockId: string) => {
      if (blockMutationPending) {
        return;
      }

      attemptStartEditing(blockId, activeSession.hasPendingChanges);
    },
    [
      activeSession.hasPendingChanges,
      attemptStartEditing,
      blockMutationPending,
    ],
  );

  return {
    editingState: activeSession.editingState,
    handleEditBlock,
  };
}
