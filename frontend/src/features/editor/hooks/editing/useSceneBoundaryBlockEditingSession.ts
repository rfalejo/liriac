import type { ChapterBlock, SceneBoundaryDraft, SceneBoundaryEditableField } from "../../types";
import type { EditorEditingSideEffects } from "./types";
import { useSceneBoundaryEditingState } from "../useSceneBoundaryEditingState";

type SceneBoundaryBlock = ChapterBlock & { type: "scene_boundary" };

type SceneBoundaryBlockEditingSessionParams = {
  block: SceneBoundaryBlock | null;
  isActive: boolean;
  isSaving: boolean;
  updateBlock: Parameters<typeof useSceneBoundaryEditingState>[0]["updateBlock"];
  onComplete: Parameters<typeof useSceneBoundaryEditingState>[0]["onComplete"];
  sideEffects: Pick<EditorEditingSideEffects, "notifyUpdateFailure">;
};

export type SceneBoundaryBlockEditingSession = {
  blockId: string | null;
  isEditing: boolean;
  draft: SceneBoundaryDraft;
  onChangeField: (field: SceneBoundaryEditableField, value: string) => void;
  hasPendingChanges: boolean;
  save: () => Promise<boolean>;
};

export function useSceneBoundaryBlockEditingSession({
  block,
  isActive,
  isSaving,
  updateBlock,
  onComplete,
  sideEffects,
}: SceneBoundaryBlockEditingSessionParams): SceneBoundaryBlockEditingSession {
  const editing = useSceneBoundaryEditingState({
    block,
    isActive,
    isSaving,
    updateBlock,
    onComplete,
    sideEffects,
  });

  return {
    blockId: block?.id ?? null,
    isEditing: Boolean(block && isActive),
    draft: editing.draft,
    onChangeField: editing.onChangeField,
    hasPendingChanges: editing.hasPendingChanges,
    save: editing.save,
  };
}
