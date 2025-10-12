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
  blockUpdatePending: boolean;
  sideEffects: EditorEditingSideEffects;
};

type UseEditorEditingStateResult = {
  editingState?: EditingState;
  handleEditBlock: (blockId: string) => void;
};

export function useEditorEditingState({
  chapter,
  updateBlock,
  blockUpdatePending,
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

  const paragraphSession = useParagraphBlockEditingSession({
    block: activeParagraphBlock,
    isActive: Boolean(activeParagraphBlock),
    isSaving: blockUpdatePending,
    updateBlock,
    onComplete: clearEditing,
    sideEffects: {
      notifyUpdateFailure: sideEffects.notifyUpdateFailure,
    },
  });

  const dialogueSession = useDialogueBlockEditingSession({
    block: activeDialogueBlock,
    isActive: Boolean(activeDialogueBlock),
    isSaving: blockUpdatePending,
    updateBlock,
    onComplete: clearEditing,
    sideEffects: {
      notifyUpdateFailure: sideEffects.notifyUpdateFailure,
    },
  });

  const sceneBoundarySession = useSceneBoundaryBlockEditingSession({
    block: activeSceneBoundaryBlock,
    isActive: Boolean(activeSceneBoundaryBlock),
    isSaving: blockUpdatePending,
    updateBlock,
    onComplete: clearEditing,
    sideEffects: {
      notifyUpdateFailure: sideEffects.notifyUpdateFailure,
    },
  });

  const metadataSession = useMetadataBlockEditingSession({
    block: activeMetadataBlock,
    isActive: Boolean(activeMetadataBlock),
    isSaving: blockUpdatePending,
    updateBlock,
    onComplete: clearEditing,
    sideEffects: {
      notifyUpdateFailure: sideEffects.notifyUpdateFailure,
    },
  });

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
            if (blockUpdatePending) {
              return;
            }
            void paragraphSession.save();
          },
          isSaving: blockUpdatePending,
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
            if (blockUpdatePending) {
              return;
            }
            void dialogueSession.save();
          },
          isSaving: blockUpdatePending,
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
            if (blockUpdatePending) {
              return;
            }
            void sceneBoundarySession.save();
          },
          isSaving: blockUpdatePending,
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
            kind: activeMetadataBlock.kind,
            draft: metadataSession.draft,
            onChangeField: metadataSession.onChangeField,
          },
          onCancel: () => {
            attemptCancelEditing(metadataSession.hasPendingChanges);
          },
          onSave: () => {
            if (blockUpdatePending) {
              return;
            }
            void metadataSession.save();
          },
          isSaving: blockUpdatePending,
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
    dialogueSession.hasPendingChanges,
    dialogueSession.onAddTurn,
    dialogueSession.onChangeTurn,
    dialogueSession.onRemoveTurn,
    dialogueSession.save,
    dialogueSession.turns,
    metadataSession.draft,
    metadataSession.hasPendingChanges,
    metadataSession.onChangeField,
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
      if (blockUpdatePending) {
        return;
      }

      attemptStartEditing(blockId, activeSession.hasPendingChanges);
    },
    [
      activeSession.hasPendingChanges,
      attemptStartEditing,
      blockUpdatePending,
    ],
  );

  return {
    editingState: activeSession.editingState,
    handleEditBlock,
  };
}
