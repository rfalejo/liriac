import type {
  ChapterBlock,
  MetadataDraft,
  MetadataEditableField,
} from "../../types";
import type { EditorEditingSideEffects } from "./types";
import { useMetadataEditingState } from "../useMetadataEditingState";

type MetadataBlock = ChapterBlock & { type: "metadata" };

type MetadataBlockEditingSessionParams = {
  block: MetadataBlock | null;
  isActive: boolean;
  isSaving: boolean;
  updateBlock: Parameters<typeof useMetadataEditingState>[0]["updateBlock"];
  onComplete: Parameters<typeof useMetadataEditingState>[0]["onComplete"];
  sideEffects: Pick<EditorEditingSideEffects, "notifyUpdateFailure">;
};

export type MetadataBlockEditingSession = {
  blockId: string | null;
  isEditing: boolean;
  draft: MetadataDraft;
  onChangeField: (field: MetadataEditableField, value: string) => void;
  hasPendingChanges: boolean;
  save: () => Promise<boolean>;
};

export function useMetadataBlockEditingSession({
  block,
  isActive,
  isSaving,
  updateBlock,
  onComplete,
  sideEffects,
}: MetadataBlockEditingSessionParams): MetadataBlockEditingSession {
  const editing = useMetadataEditingState({
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
