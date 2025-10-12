import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChapterBlockUpdatePayload } from "../../../api/chapters";
import type { ChapterBlock } from "../types";

export type ParagraphEditingSideEffects = {
  notifyUpdateFailure: (error: unknown) => void;
};

type ParagraphBlock = ChapterBlock & { type: "paragraph" };

type UseParagraphEditingStateParams = {
  block: ParagraphBlock | null;
  isActive: boolean;
  isSaving: boolean;
  updateBlock: (args: {
    blockId: string;
    payload: ChapterBlockUpdatePayload;
  }) => Promise<unknown>;
  onComplete: () => void;
  sideEffects: ParagraphEditingSideEffects;
};

type ParagraphEditingHandlers = {
  draftText: string;
  onChangeDraft: (value: string) => void;
  hasPendingChanges: boolean;
  save: () => Promise<boolean>;
};

export function useParagraphEditingState({
  block,
  isActive,
  isSaving,
  updateBlock,
  onComplete,
  sideEffects,
}: UseParagraphEditingStateParams): ParagraphEditingHandlers {
  const [draftText, setDraftText] = useState<string>("");
  const [syncedBlockId, setSyncedBlockId] = useState<string | null>(null);

  useEffect(() => {
    if (isActive && block) {
      setDraftText(block.text ?? "");
      setSyncedBlockId(block.id);
    }
  }, [block?.id, isActive]);

  useEffect(() => {
    if (!isActive) {
      setDraftText("");
      setSyncedBlockId(null);
    }
  }, [isActive]);

  const effectiveDraftText = useMemo(() => {
    if (isActive && block && block.id !== syncedBlockId) {
      return block.text ?? "";
    }
    return draftText;
  }, [block, draftText, isActive, syncedBlockId]);

  const hasPendingChanges = useMemo(() => {
    if (!isActive || !block) {
      return false;
    }
    return effectiveDraftText !== (block.text ?? "");
  }, [block, effectiveDraftText, isActive]);

  const onChangeDraft = useCallback(
    (value: string) => {
      if (!isActive) {
        return;
      }
      setDraftText(value);
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
        payload: { text: effectiveDraftText },
      });
      onComplete();
      return true;
    } catch (error) {
      sideEffects.notifyUpdateFailure(error);
      return false;
    }
  }, [
    block,
    effectiveDraftText,
    hasPendingChanges,
    isActive,
    isSaving,
    onComplete,
    sideEffects,
    updateBlock,
  ]);

  return {
    draftText: effectiveDraftText,
    hasPendingChanges,
    onChangeDraft,
    save,
  };
}
