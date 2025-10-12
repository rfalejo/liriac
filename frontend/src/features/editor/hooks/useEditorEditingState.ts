import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ChapterBlockUpdatePayload,
  ChapterDetail,
} from "../../../api/chapters";
import type { ChapterBlock, EditingState } from "../types";
import { useChapterBlockSelectors } from "./useChapterBlockSelectors";
import { useDialogueEditingState } from "./useDialogueEditingState";
import { useParagraphEditingState } from "./useParagraphEditingState";

const EDITABLE_BLOCK_TYPES: ReadonlyArray<ChapterBlock["type"]> = [
  "paragraph",
  "dialogue",
];

export type EditingDiscardContext = "cancel" | "switch";

export type EditorEditingSideEffects = {
  confirmDiscardChanges: (
    context: EditingDiscardContext,
  ) => Promise<boolean> | boolean;
  notifyUpdateFailure: (error: unknown) => void;
};

type UseEditorEditingStateParams = {
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

type ParagraphBlock = ChapterBlock & { type: "paragraph" };
type DialogueBlock = ChapterBlock & { type: "dialogue" };

async function resolveDiscardDecision(
  confirm: EditorEditingSideEffects["confirmDiscardChanges"],
  context: EditingDiscardContext,
): Promise<boolean> {
  const result = confirm(context);
  return typeof result === "boolean" ? result : await result;
}

export function useEditorEditingState({
  chapter,
  updateBlock,
  blockUpdatePending,
  sideEffects,
}: UseEditorEditingStateParams): UseEditorEditingStateResult {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const { getBlockById } = useChapterBlockSelectors(chapter);

  useEffect(() => {
    setEditingBlockId(null);
  }, [chapter?.id]);

  const activeBlock = useMemo(() => {
    if (!editingBlockId) {
      return null;
    }
    return getBlockById(editingBlockId);
  }, [editingBlockId, getBlockById]);

  const activeParagraphBlock =
    activeBlock?.type === "paragraph"
      ? (activeBlock as ParagraphBlock)
      : null;
  const activeDialogueBlock =
    activeBlock?.type === "dialogue" ? (activeBlock as DialogueBlock) : null;

  const paragraphEditing = useParagraphEditingState({
    block: activeParagraphBlock,
    isActive: Boolean(activeParagraphBlock),
    isSaving: blockUpdatePending,
    updateBlock,
    onComplete: () => {
      setEditingBlockId(null);
    },
    sideEffects: {
      notifyUpdateFailure: sideEffects.notifyUpdateFailure,
    },
  });

  const dialogueEditing = useDialogueEditingState({
    block: activeDialogueBlock,
    isActive: Boolean(activeDialogueBlock),
    isSaving: blockUpdatePending,
    updateBlock,
    onComplete: () => {
      setEditingBlockId(null);
    },
    sideEffects: {
      notifyUpdateFailure: sideEffects.notifyUpdateFailure,
    },
  });

  const {
    draftText: paragraphDraftText,
    hasPendingChanges: paragraphHasPendingChanges,
    onChangeDraft: handleParagraphDraftChange,
    save: saveParagraph,
  } = paragraphEditing;

  const {
    hasPendingChanges: dialogueHasPendingChanges,
    onAddTurn: handleDialogueAddTurn,
    onChangeTurn: handleDialogueTurnChange,
    onRemoveTurn: handleDialogueRemoveTurn,
    save: saveDialogue,
    turns: dialogueTurns,
  } = dialogueEditing;

  const hasPendingChanges = useMemo(() => {
    if (activeParagraphBlock) {
      return paragraphHasPendingChanges;
    }
    if (activeDialogueBlock) {
      return dialogueHasPendingChanges;
    }
    return false;
  }, [
    activeDialogueBlock,
    activeParagraphBlock,
    dialogueHasPendingChanges,
    paragraphHasPendingChanges,
  ]);

  const handleCancelEdit = useCallback(() => {
    if (!editingBlockId) {
      return;
    }

    const cancel = async () => {
      if (hasPendingChanges) {
        const confirmed = await resolveDiscardDecision(
          sideEffects.confirmDiscardChanges,
          "cancel",
        );
        if (!confirmed) {
          return;
        }
      }
      setEditingBlockId(null);
    };

    void cancel();
  }, [editingBlockId, hasPendingChanges, sideEffects.confirmDiscardChanges]);

  const saveActiveBlock = useCallback(() => {
    if (!editingBlockId || blockUpdatePending) {
      return;
    }

    const save = async () => {
      if (activeParagraphBlock) {
        await saveParagraph();
        return;
      }
      if (activeDialogueBlock) {
        await saveDialogue();
      }
    };

    void save();
  }, [
    activeDialogueBlock,
    activeParagraphBlock,
    blockUpdatePending,
    editingBlockId,
    saveDialogue,
    saveParagraph,
  ]);

  const handleEditBlock = useCallback(
    (blockId: string) => {
      if (blockUpdatePending) {
        return;
      }

      const target = getBlockById(blockId);
      if (!target || !EDITABLE_BLOCK_TYPES.includes(target.type)) {
        return;
      }

      const startEditing = async () => {
        if (editingBlockId && editingBlockId !== blockId && hasPendingChanges) {
          const confirmed = await resolveDiscardDecision(
            sideEffects.confirmDiscardChanges,
            "switch",
          );
          if (!confirmed) {
            return;
          }
        }

        setEditingBlockId(blockId);
      };

      void startEditing();
    },
    [
      blockUpdatePending,
      editingBlockId,
      getBlockById,
      hasPendingChanges,
      sideEffects.confirmDiscardChanges,
    ],
  );

  const editingState = useMemo<EditingState | undefined>(() => {
    if (activeParagraphBlock) {
      return {
        blockId: activeParagraphBlock.id,
        blockType: "paragraph",
        paragraph: {
          draftText: paragraphDraftText,
          onChangeDraft: handleParagraphDraftChange,
        },
        onCancel: handleCancelEdit,
        onSave: () => {
          saveActiveBlock();
        },
        isSaving: blockUpdatePending,
      };
    }

    if (activeDialogueBlock) {
      return {
        blockId: activeDialogueBlock.id,
        blockType: "dialogue",
        dialogue: {
          turns: dialogueTurns,
          onChangeTurn: handleDialogueTurnChange,
          onAddTurn: handleDialogueAddTurn,
          onRemoveTurn: handleDialogueRemoveTurn,
        },
        onCancel: handleCancelEdit,
        onSave: () => {
          saveActiveBlock();
        },
        isSaving: blockUpdatePending,
      };
    }

    return undefined;
  }, [
    activeDialogueBlock,
    activeParagraphBlock,
    blockUpdatePending,
    dialogueTurns,
    handleDialogueAddTurn,
    handleDialogueRemoveTurn,
    handleDialogueTurnChange,
    handleCancelEdit,
    handleParagraphDraftChange,
    paragraphDraftText,
    saveActiveBlock,
  ]);

  return {
    editingState,
    handleEditBlock,
  };
}
