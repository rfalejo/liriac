import type { ChapterBlock } from "../../types";
import type { EditorEditingSideEffects } from "./types";
import { useParagraphEditingState } from "../useParagraphEditingState";

type ParagraphBlock = ChapterBlock & { type: "paragraph" };

export type ParagraphBlockEditingSessionParams = {
  block: ParagraphBlock | null;
  isActive: boolean;
  isSaving: boolean;
  updateBlock: Parameters<typeof useParagraphEditingState>[0]["updateBlock"];
  onComplete: Parameters<typeof useParagraphEditingState>[0]["onComplete"];
  sideEffects: Pick<EditorEditingSideEffects, "notifyUpdateFailure">;
};

export type ParagraphBlockEditingSession = {
  blockId: string | null;
  isEditing: boolean;
  draftText: string;
  onChangeDraft: (value: string) => void;
  hasPendingChanges: boolean;
  save: () => Promise<boolean>;
};

export function useParagraphBlockEditingSession({
  block,
  isActive,
  isSaving,
  updateBlock,
  onComplete,
  sideEffects,
}: ParagraphBlockEditingSessionParams): ParagraphBlockEditingSession {
  const paragraphEditing = useParagraphEditingState({
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
    draftText: paragraphEditing.draftText,
    onChangeDraft: paragraphEditing.onChangeDraft,
    hasPendingChanges: paragraphEditing.hasPendingChanges,
    save: paragraphEditing.save,
  };
}
