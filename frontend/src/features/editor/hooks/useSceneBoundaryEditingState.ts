import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChapterBlockUpdatePayload } from "../../../api/chapters";
import type {
  ChapterBlock,
  SceneBoundaryDraft,
  SceneBoundaryEditableField,
} from "../types";

export type SceneBoundaryEditingSideEffects = {
  notifyUpdateFailure: (error: unknown) => void;
};

type SceneBoundaryBlock = ChapterBlock & { type: "scene_boundary" };

type UseSceneBoundaryEditingStateParams = {
  block: SceneBoundaryBlock | null;
  isActive: boolean;
  isSaving: boolean;
  updateBlock: (args: {
    blockId: string;
    payload: ChapterBlockUpdatePayload;
  }) => Promise<unknown>;
  onComplete: () => void;
  sideEffects: SceneBoundaryEditingSideEffects;
};

type SceneBoundaryEditingHandlers = {
  draft: SceneBoundaryDraft;
  hasPendingChanges: boolean;
  onChangeField: (field: SceneBoundaryEditableField, value: string) => void;
  save: () => Promise<boolean>;
};

const EMPTY_DRAFT: SceneBoundaryDraft = {
  label: "",
  summary: "",
};

function toDraft(block: SceneBoundaryBlock | null): SceneBoundaryDraft {
  if (!block) {
    return EMPTY_DRAFT;
  }
  return {
    label: block.label ?? "",
    summary: block.summary ?? "",
  };
}

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function useSceneBoundaryEditingState({
  block,
  isActive,
  isSaving,
  updateBlock,
  onComplete,
  sideEffects,
}: UseSceneBoundaryEditingStateParams): SceneBoundaryEditingHandlers {
  const [draft, setDraft] = useState<SceneBoundaryDraft>(EMPTY_DRAFT);
  const [syncedBlockId, setSyncedBlockId] = useState<string | null>(null);

  useEffect(() => {
    if (isActive && block) {
      setDraft(toDraft(block));
      setSyncedBlockId(block.id);
    }
  }, [block?.id, isActive]);

  useEffect(() => {
    if (!isActive) {
      setDraft(EMPTY_DRAFT);
      setSyncedBlockId(null);
    }
  }, [isActive]);

  const effectiveDraft = useMemo(() => {
    if (isActive && block && block.id !== syncedBlockId) {
      return toDraft(block);
    }
    return draft;
  }, [block, draft, isActive, syncedBlockId]);

  const hasPendingChanges = useMemo(() => {
    if (!isActive || !block) {
      return false;
    }
    return (
      (effectiveDraft.label ?? "") !== (block.label ?? "") ||
      (effectiveDraft.summary ?? "") !== (block.summary ?? "")
    );
  }, [block, effectiveDraft, isActive]);

  const onChangeField = useCallback(
    (field: SceneBoundaryEditableField, value: string) => {
      if (!isActive) {
        return;
      }
      setDraft((prev) => ({
        ...prev,
        [field]: value,
      }));
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
        payload: {
          label: toNullable(effectiveDraft.label),
          summary: toNullable(effectiveDraft.summary),
        },
      });
      onComplete();
      return true;
    } catch (error) {
      sideEffects.notifyUpdateFailure(error);
      return false;
    }
  }, [
    block,
    effectiveDraft.label,
    effectiveDraft.summary,
    hasPendingChanges,
    isActive,
    isSaving,
    onComplete,
    sideEffects,
    updateBlock,
  ]);

  return {
    draft: effectiveDraft,
    hasPendingChanges,
    onChangeField,
    save,
  };
}
