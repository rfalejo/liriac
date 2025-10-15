import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ChapterBlockUpdatePayload } from "../../../../api/chapters";
import type { ChapterBlock } from "../../types";

export type BlockEditingSideEffects = {
  notifyUpdateFailure: (error: unknown) => void;
};

export type BlockEditingParams<Block extends ChapterBlock> = {
  block: Block | null;
  isActive: boolean;
  isSaving: boolean;
  updateBlock: (args: {
    blockId: string;
    payload: ChapterBlockUpdatePayload;
  }) => Promise<unknown>;
  onComplete: () => void;
  sideEffects: BlockEditingSideEffects;
};

export type BlockEditingState<Draft> = {
  draft: Draft;
  setDraft: Dispatch<SetStateAction<Draft>>;
  hasPendingChanges: boolean;
  save: () => Promise<boolean>;
};

type BlockEditingConfig<Block extends ChapterBlock, Draft> = {
  deriveDraft: (block: Block | null) => Draft;
  hasChanges: (input: { block: Block; draft: Draft }) => boolean;
  buildPayload: (draft: Draft) => ChapterBlockUpdatePayload;
};

export function createBlockEditingState<Block extends ChapterBlock, Draft>(
  config: BlockEditingConfig<Block, Draft>,
) {
  const { deriveDraft, hasChanges, buildPayload } = config;

  return function useBlockEditingState(
    params: BlockEditingParams<Block>,
  ): BlockEditingState<Draft> {
    const { block, isActive, isSaving, updateBlock, onComplete, sideEffects } =
      params;

    const [draft, setDraft] = useState<Draft>(() => deriveDraft(null));
    const syncedIdentityRef = useRef<{ id: string | null; version: number | null }>(
      { id: null, version: null },
    );

    const resolveActiveVersion = useCallback((source: Block | null): number | null => {
      if (!source) {
        return null;
      }

      const maybeVersion = (source as { activeVersion?: number }).activeVersion;
      return typeof maybeVersion === "number" ? maybeVersion : null;
    }, []);

    useEffect(() => {
      if (!isActive) {
        setDraft(deriveDraft(null));
        syncedIdentityRef.current = { id: null, version: null };
        return;
      }

      if (!block) {
        setDraft(deriveDraft(null));
        syncedIdentityRef.current = { id: null, version: null };
        return;
      }

      const activeVersion = resolveActiveVersion(block);
      const { id, version } = syncedIdentityRef.current;

      if (block.id !== id || activeVersion !== version) {
        setDraft(deriveDraft(block));
        syncedIdentityRef.current = { id: block.id, version: activeVersion };
      }
    }, [block, deriveDraft, isActive, resolveActiveVersion]);

    const effectiveDraft = useMemo(() => {
      if (isActive && block) {
        const activeVersion = resolveActiveVersion(block);
        const { id, version } = syncedIdentityRef.current;
        if (block.id !== id || activeVersion !== version) {
          return deriveDraft(block);
        }
      }
      return draft;
    }, [block, deriveDraft, draft, isActive, resolveActiveVersion]);

    const hasPendingChanges = useMemo(() => {
      if (!isActive || !block) {
        return false;
      }
      return hasChanges({ block, draft: effectiveDraft });
    }, [block, effectiveDraft, hasChanges, isActive]);

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
          payload: buildPayload(effectiveDraft),
        });
        onComplete();
        return true;
      } catch (error) {
        sideEffects.notifyUpdateFailure(error);
        return false;
      }
    }, [
      block,
      buildPayload,
      effectiveDraft,
      hasPendingChanges,
      isActive,
      isSaving,
      onComplete,
      sideEffects,
      updateBlock,
    ]);

    return {
      draft: effectiveDraft,
      setDraft,
      hasPendingChanges,
      save,
    };
  };
}
