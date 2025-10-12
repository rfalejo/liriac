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
import { useParagraphBlockEditingSession } from "./editing/useParagraphBlockEditingSession";

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
        },
      };
    }

    return {
      hasPendingChanges: false,
      editingState: undefined,
    };
  }, [
    activeDialogueBlock,
    activeParagraphBlock,
    attemptCancelEditing,
    blockUpdatePending,
    dialogueSession.hasPendingChanges,
    dialogueSession.onAddTurn,
    dialogueSession.onChangeTurn,
    dialogueSession.onRemoveTurn,
    dialogueSession.save,
    dialogueSession.turns,
    paragraphSession.draftText,
    paragraphSession.hasPendingChanges,
    paragraphSession.onChangeDraft,
    paragraphSession.save,
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
