import type { ChapterBlock, ParagraphSuggestionState } from "../../types";
import type { EditorEditingSideEffects } from "./types";
import { useParagraphEditingState } from "../useParagraphEditingState";
import { useParagraphSuggestionController } from "./useParagraphSuggestionController";

type ParagraphBlock = ChapterBlock & { type: "paragraph" };

export type ParagraphBlockEditingSessionParams = {
  block: ParagraphBlock | null;
  isActive: boolean;
  isSaving: boolean;
  chapterId: string | null;
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
  suggestion: ParagraphSuggestionState;
  openSuggestionPrompt: () => void;
  closeSuggestionPrompt: () => void;
  isSuggestionPending: boolean;
};


export function useParagraphBlockEditingSession({
  block,
  isActive,
  isSaving,
  chapterId,
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

  const {
    suggestionState,
    openPrompt,
    closePrompt,
    isPending,
  } = useParagraphSuggestionController({
    block,
    isActive: Boolean(block && isActive),
    draftText: paragraphEditing.draftText,
    onChangeDraft: paragraphEditing.onChangeDraft,
    chapterId,
    notifyUpdateFailure: sideEffects.notifyUpdateFailure,
  });

  return {
    blockId: block?.id ?? null,
    isEditing: Boolean(block && isActive),
    draftText: paragraphEditing.draftText,
    onChangeDraft: paragraphEditing.onChangeDraft,
    hasPendingChanges: paragraphEditing.hasPendingChanges,
    save: paragraphEditing.save,
    suggestion: suggestionState,
    openSuggestionPrompt: openPrompt,
    closeSuggestionPrompt: closePrompt,
    isSuggestionPending: isPending,
  };
}
