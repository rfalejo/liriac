import { useCallback } from "react";
import type {
  ChapterBlock,
  SceneBoundaryDraft,
  SceneBoundaryEditableField,
} from "../types";
import {
  createBlockEditingState,
  type BlockEditingParams,
  type BlockEditingSideEffects,
} from "./editing/createBlockEditingState";

export type SceneBoundaryEditingSideEffects = BlockEditingSideEffects;

type SceneBoundaryBlock = ChapterBlock & { type: "scene_boundary" };

type UseSceneBoundaryEditingStateParams =
  BlockEditingParams<SceneBoundaryBlock>;

type SceneBoundaryEditingHandlers = {
  draft: SceneBoundaryDraft;
  hasPendingChanges: boolean;
  onChangeField: (field: SceneBoundaryEditableField, value: string) => void;
  save: () => Promise<boolean>;
};

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const useSceneBoundaryBlockEditingState = createBlockEditingState<
  SceneBoundaryBlock,
  SceneBoundaryDraft
>({
  deriveDraft: (block) => ({
    label: block?.label ?? "",
    summary: block?.summary ?? "",
  }),
  hasChanges: ({ block, draft }) =>
    (draft.label ?? "") !== (block.label ?? "") ||
    (draft.summary ?? "") !== (block.summary ?? ""),
  buildPayload: (draft) => ({
    label: toNullable(draft.label),
    summary: toNullable(draft.summary),
  }),
});

export function useSceneBoundaryEditingState(
  params: UseSceneBoundaryEditingStateParams,
): SceneBoundaryEditingHandlers {
  const { draft, setDraft, hasPendingChanges, save } =
    useSceneBoundaryBlockEditingState(params);
  const { isActive } = params;

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
    [isActive, setDraft],
  );

  return {
    draft,
    hasPendingChanges,
    onChangeField,
    save,
  };
}
