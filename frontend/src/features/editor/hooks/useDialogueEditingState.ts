import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChapterBlockUpdatePayload } from "../../../api/chapters";
import type { ChapterBlock, DialogueField, DialogueTurn } from "../types";
import {
  cloneTurns,
  createEmptyTurn,
  equalTurns,
} from "../utils/dialogueTurns";

export type DialogueEditingSideEffects = {
  notifyUpdateFailure: (error: unknown) => void;
};

type DialogueBlock = ChapterBlock & { type: "dialogue" };

type UseDialogueEditingStateParams = {
  block: DialogueBlock | null;
  isActive: boolean;
  isSaving: boolean;
  updateBlock: (args: {
    blockId: string;
    payload: ChapterBlockUpdatePayload;
  }) => Promise<unknown>;
  onComplete: () => void;
  sideEffects: DialogueEditingSideEffects;
};

type DialogueEditingHandlers = {
  turns: DialogueTurn[];
  hasPendingChanges: boolean;
  onChangeTurn: (turnId: string, field: DialogueField, value: string) => void;
  onAddTurn: () => void;
  onRemoveTurn: (turnId: string) => void;
  save: () => Promise<boolean>;
};

export function useDialogueEditingState({
  block,
  isActive,
  isSaving,
  updateBlock,
  onComplete,
  sideEffects,
}: UseDialogueEditingStateParams): DialogueEditingHandlers {
  const [draftTurns, setDraftTurns] = useState<DialogueTurn[]>([]);
  const [syncedBlockId, setSyncedBlockId] = useState<string | null>(null);
  const previousBlockIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isActive || !block) {
      return;
    }

    if (previousBlockIdRef.current === block.id) {
      return;
    }

    previousBlockIdRef.current = block.id;
    setDraftTurns(cloneTurns(block.turns));
    setSyncedBlockId(block.id);
  }, [block, isActive]);

  useEffect(() => {
    if (!isActive) {
      setDraftTurns([]);
      setSyncedBlockId(null);
      previousBlockIdRef.current = null;
    }
  }, [isActive]);

  const effectiveTurns = useMemo(() => {
    if (isActive && block && block.id !== syncedBlockId) {
      return cloneTurns(block.turns);
    }
    return draftTurns;
  }, [block, draftTurns, isActive, syncedBlockId]);

  const hasPendingChanges = useMemo(() => {
    if (!isActive || !block) {
      return false;
    }
    return !equalTurns(effectiveTurns, cloneTurns(block.turns));
  }, [block, effectiveTurns, isActive]);

  const onChangeTurn = useCallback(
    (turnId: string, field: DialogueField, value: string) => {
      if (!isActive) {
        return;
      }
      setDraftTurns((prev) =>
        prev.map((turn) => {
          if (turn.id !== turnId) {
            return turn;
          }

          if (field === "speakerName") {
            return { ...turn, speakerName: value };
          }
          if (field === "utterance") {
            return { ...turn, utterance: value };
          }
          if (field === "stageDirection") {
            return { ...turn, stageDirection: value ? value : null };
          }
          return turn;
        }),
      );
    },
    [isActive],
  );

  const onAddTurn = useCallback(() => {
    if (!isActive) {
      return;
    }
    setDraftTurns((prev) => [...prev, createEmptyTurn()]);
  }, [isActive]);

  const onRemoveTurn = useCallback(
    (turnId: string) => {
      if (!isActive) {
        return;
      }
      setDraftTurns((prev) => prev.filter((turn) => turn.id !== turnId));
    },
    [isActive],
  );

  const save = useCallback(async () => {
    if (!isActive || !block || isSaving) {
      return false;
    }

    if (!hasPendingChanges) {
      onComplete();
      return true;
    }

    try {
      await updateBlock({
        blockId: block.id,
        payload: { turns: effectiveTurns },
      });
      onComplete();
      return true;
    } catch (error) {
      sideEffects.notifyUpdateFailure(error);
      return false;
    }
  }, [
    block,
    effectiveTurns,
    hasPendingChanges,
    isActive,
    isSaving,
    onComplete,
    sideEffects,
    updateBlock,
  ]);

  return {
    hasPendingChanges,
    onAddTurn,
    onChangeTurn,
    onRemoveTurn,
    save,
    turns: effectiveTurns,
  };
}
