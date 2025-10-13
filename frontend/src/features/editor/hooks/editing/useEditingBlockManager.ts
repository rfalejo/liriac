import { useCallback, useEffect, useState } from "react";
import type { ChapterBlock } from "../../types";
import { EDITABLE_BLOCK_TYPES } from "./constants";
import type { EditingDiscardContext } from "./types";

export type ConfirmDiscardChanges = (
  context: EditingDiscardContext,
) => Promise<boolean> | boolean;

export type UseEditingBlockManagerParams = {
  chapterId: string | null;
  getBlockById: (blockId: string) => ChapterBlock | null;
  confirmDiscardChanges: ConfirmDiscardChanges;
};

export type UseEditingBlockManagerResult = {
  activeBlockId: string | null;
  attemptCancelEditing: (hasPendingChanges: boolean) => void;
  attemptStartEditing: (blockId: string, hasPendingChanges: boolean) => void;
  clearEditing: () => void;
};

async function resolveDiscardDecision(
  confirm: ConfirmDiscardChanges,
  context: EditingDiscardContext,
): Promise<boolean> {
  const result = confirm(context);
  return typeof result === "boolean" ? result : await result;
}

export function useEditingBlockManager({
  chapterId,
  getBlockById,
  confirmDiscardChanges,
}: UseEditingBlockManagerParams): UseEditingBlockManagerResult {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  useEffect(() => {
    setActiveBlockId(null);
  }, [chapterId]);

  const clearEditing = useCallback(() => {
    setActiveBlockId(null);
  }, []);

  const attemptCancelEditing = useCallback(
    (hasPendingChanges: boolean) => {
      if (!activeBlockId) {
        return;
      }

      const cancel = async () => {
        if (hasPendingChanges) {
          const confirmed = await resolveDiscardDecision(
            confirmDiscardChanges,
            "cancel",
          );
          if (!confirmed) {
            return;
          }
        }

        clearEditing();
      };

      void cancel();
    },
    [activeBlockId, clearEditing, confirmDiscardChanges],
  );

  const attemptStartEditing = useCallback(
    (blockId: string, hasPendingChanges: boolean) => {
      const target = getBlockById(blockId);
      if (!target || !EDITABLE_BLOCK_TYPES.includes(target.type)) {
        return;
      }

      const start = async () => {
        if (activeBlockId && activeBlockId !== blockId && hasPendingChanges) {
          const confirmed = await resolveDiscardDecision(
            confirmDiscardChanges,
            "switch",
          );
          if (!confirmed) {
            return;
          }
        }

        setActiveBlockId(blockId);
      };

      void start();
    },
    [activeBlockId, confirmDiscardChanges, getBlockById],
  );

  return {
    activeBlockId,
    attemptCancelEditing,
    attemptStartEditing,
    clearEditing,
  };
}
