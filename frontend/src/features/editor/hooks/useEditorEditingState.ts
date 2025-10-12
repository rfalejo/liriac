import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ChapterBlockUpdatePayload,
  ChapterDetail,
} from "../../../api/chapters";
import type {
  ChapterBlock,
  DialogueField,
  DialogueTurn,
  EditingState,
} from "../types";
import {
  cloneTurns,
  createEmptyTurn,
  equalTurns,
} from "../utils/dialogueTurns";

const EDITABLE_BLOCK_TYPES: Array<ChapterBlock["type"]> = [
  "paragraph",
  "dialogue",
];

type UseEditorEditingStateParams = {
  chapter: ChapterDetail | null;
  updateBlock: (args: {
    blockId: string;
    payload: ChapterBlockUpdatePayload;
  }) => Promise<ChapterDetail>;
  blockUpdatePending: boolean;
};

type UseEditorEditingStateResult = {
  editingState?: EditingState;
  handleEditBlock: (blockId: string) => void;
};

export function useEditorEditingState({
  chapter,
  updateBlock,
  blockUpdatePending,
}: UseEditorEditingStateParams): UseEditorEditingStateResult {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingBlockType, setEditingBlockType] = useState<
    ChapterBlock["type"] | null
  >(null);
  const [draftText, setDraftText] = useState<string>("");
  const [draftTurns, setDraftTurns] = useState<DialogueTurn[]>([]);

  useEffect(() => {
    setEditingBlockId(null);
    setEditingBlockType(null);
    setDraftText("");
    setDraftTurns([]);
  }, [chapter?.id]);

  const resetDrafts = useCallback(() => {
    setEditingBlockId(null);
    setEditingBlockType(null);
    setDraftText("");
    setDraftTurns([]);
  }, []);

  const getBlockById = useCallback(
    (targetId: string) => {
      if (!chapter) {
        return null;
      }
      return chapter.blocks.find((item) => item.id === targetId) ?? null;
    },
    [chapter],
  );

  const getParagraphBlock = useCallback(
    (targetId: string) => {
      const block = getBlockById(targetId);
      return block?.type === "paragraph" ? block : null;
    },
    [getBlockById],
  );

  const getDialogueBlock = useCallback(
    (targetId: string) => {
      const block = getBlockById(targetId);
      return block?.type === "dialogue" ? block : null;
    },
    [getBlockById],
  );

  const hasPendingChanges = useCallback(() => {
    if (!editingBlockId || !editingBlockType) {
      return false;
    }

    if (editingBlockType === "paragraph") {
      const current = getParagraphBlock(editingBlockId);
      const original = current?.text ?? "";
      return draftText !== original;
    }

    if (editingBlockType === "dialogue") {
      const current = getDialogueBlock(editingBlockId);
      const originalTurns = cloneTurns(current?.turns);
      return !equalTurns(draftTurns, originalTurns);
    }

    return false;
  }, [
    draftText,
    draftTurns,
    editingBlockId,
    editingBlockType,
    getDialogueBlock,
    getParagraphBlock,
  ]);

  const handleDraftChange = useCallback(
    (value: string) => {
      if (editingBlockType !== "paragraph") {
        return;
      }
      setDraftText(value);
    },
    [editingBlockType],
  );

  const handleDialogueTurnChange = useCallback(
    (turnId: string, field: DialogueField, value: string) => {
      if (editingBlockType !== "dialogue") {
        return;
      }

      setDraftTurns((prev) =>
        prev.map((turn) => {
          if (turn.id !== turnId) {
            return turn;
          }

          const draft = { ...turn };
          if (field === "speakerName") {
            draft.speakerName = value;
          }
          if (field === "utterance") {
            draft.utterance = value;
          }
          if (field === "stageDirection") {
            draft.stageDirection = value ? value : null;
          }
          return draft;
        }),
      );
    },
    [editingBlockType],
  );

  const handleAddDialogueTurn = useCallback(() => {
    if (editingBlockType !== "dialogue") {
      return;
    }
    setDraftTurns((prev) => [...prev, createEmptyTurn()]);
  }, [editingBlockType]);

  const handleRemoveDialogueTurn = useCallback(
    (turnId: string) => {
      if (editingBlockType !== "dialogue") {
        return;
      }
      setDraftTurns((prev) => prev.filter((turn) => turn.id !== turnId));
    },
    [editingBlockType],
  );

  const handleCancelEdit = useCallback(() => {
    if (!editingBlockId || !editingBlockType) {
      return;
    }

    if (hasPendingChanges()) {
      const confirmCancel = window.confirm("¿Deseas descartar los cambios?");
      if (!confirmCancel) {
        return;
      }
    }

    resetDrafts();
  }, [editingBlockId, editingBlockType, hasPendingChanges, resetDrafts]);

  const handleSaveEdit = useCallback(async () => {
    if (
      !editingBlockId ||
      !chapter ||
      blockUpdatePending ||
      !editingBlockType
    ) {
      return;
    }

    try {
      if (editingBlockType === "paragraph") {
        const current = getParagraphBlock(editingBlockId);
        const originalText = current?.text ?? "";
        if (draftText === originalText) {
          resetDrafts();
          return;
        }

        await updateBlock({
          blockId: editingBlockId,
          payload: { text: draftText },
        });
      } else if (editingBlockType === "dialogue") {
        const current = getDialogueBlock(editingBlockId);
        const originalTurns = cloneTurns(current?.turns);
        if (equalTurns(draftTurns, originalTurns)) {
          resetDrafts();
          return;
        }

        await updateBlock({
          blockId: editingBlockId,
          payload: { turns: draftTurns },
        });
      } else {
        return;
      }

      resetDrafts();
    } catch (error) {
      console.error("Failed to update block", error);
      window.alert("No se pudieron guardar los cambios. Intenta de nuevo.");
    }
  }, [
    blockUpdatePending,
    chapter,
    draftText,
    draftTurns,
    editingBlockId,
    editingBlockType,
    getDialogueBlock,
    getParagraphBlock,
    resetDrafts,
    updateBlock,
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

      if (editingBlockId && editingBlockId !== blockId && hasPendingChanges()) {
        const confirmSwitch = window.confirm(
          "¿Quieres descartar los cambios pendientes?",
        );
        if (!confirmSwitch) {
          return;
        }
      }

      setEditingBlockId(blockId);
      setEditingBlockType(target.type);

      if (target.type === "paragraph") {
        setDraftText(target.text ?? "");
        setDraftTurns([]);
        return;
      }

      if (target.type === "dialogue") {
        setDraftText("");
        setDraftTurns(cloneTurns(target.turns));
        return;
      }
    },
    [blockUpdatePending, editingBlockId, getBlockById, hasPendingChanges],
  );

  const editingState = useMemo<EditingState | undefined>(() => {
    if (!editingBlockId || !editingBlockType) {
      return undefined;
    }

    if (editingBlockType === "paragraph") {
      return {
        blockId: editingBlockId,
        blockType: "paragraph",
        paragraph: {
          draftText,
          onChangeDraft: handleDraftChange,
        },
        onCancel: handleCancelEdit,
        onSave: () => {
          void handleSaveEdit();
        },
        isSaving: blockUpdatePending,
      };
    }

    if (editingBlockType === "dialogue") {
      return {
        blockId: editingBlockId,
        blockType: "dialogue",
        dialogue: {
          turns: draftTurns,
          onChangeTurn: handleDialogueTurnChange,
          onAddTurn: handleAddDialogueTurn,
          onRemoveTurn: handleRemoveDialogueTurn,
        },
        onCancel: handleCancelEdit,
        onSave: () => {
          void handleSaveEdit();
        },
        isSaving: blockUpdatePending,
      };
    }

    return undefined;
  }, [
    blockUpdatePending,
    draftText,
    draftTurns,
    editingBlockId,
    editingBlockType,
    handleAddDialogueTurn,
    handleCancelEdit,
    handleDialogueTurnChange,
    handleDraftChange,
    handleRemoveDialogueTurn,
    handleSaveEdit,
  ]);

  return {
    editingState,
    handleEditBlock,
  };
}
