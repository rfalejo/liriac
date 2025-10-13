import type {
  ChapterBlock,
  MetadataDraft,
  MetadataEditableField,
  MetadataKindOption,
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
  kind: MetadataKindOption;
  draft: MetadataDraft;
  onChangeField: (field: MetadataEditableField, value: string) => void;
  onChangeKind: (nextKind: MetadataKindOption) => void;
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
    kind: editing.kind,
    draft: editing.draft,
    onChangeField: editing.onChangeField,
    onChangeKind: editing.onChangeKind,
    hasPendingChanges: editing.hasPendingChanges,
    save: editing.save,
  };
}
