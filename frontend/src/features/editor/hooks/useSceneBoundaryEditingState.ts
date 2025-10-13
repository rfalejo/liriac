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
    locationName:
      block?.sceneDetails?.locationName ?? block?.locationName ?? "",
    timestamp: block?.sceneDetails?.timestamp ?? block?.timestamp ?? "",
    mood: block?.sceneDetails?.mood ?? block?.mood ?? "",
  }),
  hasChanges: ({ block, draft }) =>
    (draft.label ?? "") !== (block.label ?? "") ||
    (draft.summary ?? "") !== (block.summary ?? "") ||
    (draft.locationName ?? "") !==
      (block.sceneDetails?.locationName ?? block.locationName ?? "") ||
    (draft.timestamp ?? "") !==
      (block.sceneDetails?.timestamp ?? block.timestamp ?? "") ||
    (draft.mood ?? "") !== (block.sceneDetails?.mood ?? block.mood ?? ""),
  buildPayload: (draft) => ({
    label: toNullable(draft.label),
    summary: toNullable(draft.summary),
    sceneDetails: {
      locationName: toNullable(draft.locationName),
      timestamp: toNullable(draft.timestamp),
      mood: toNullable(draft.mood),
    },
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
