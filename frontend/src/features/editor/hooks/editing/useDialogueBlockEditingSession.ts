import type { ChapterBlock } from "../../types";
import type { EditorEditingSideEffects } from "./types";
import { useDialogueEditingState } from "../useDialogueEditingState";
import type { DialogueField, DialogueTurn } from "../../types";

type DialogueBlock = ChapterBlock & { type: "dialogue" };

export type DialogueBlockEditingSessionParams = {
  block: DialogueBlock | null;
  isActive: boolean;
  isSaving: boolean;
  updateBlock: Parameters<typeof useDialogueEditingState>[0]["updateBlock"];
  onComplete: Parameters<typeof useDialogueEditingState>[0]["onComplete"];
  sideEffects: Pick<EditorEditingSideEffects, "notifyUpdateFailure">;
};

export type DialogueBlockEditingSession = {
  blockId: string | null;
  isEditing: boolean;
  turns: DialogueTurn[];
  onChangeTurn: (turnId: string, field: DialogueField, value: string) => void;
  onAddTurn: () => void;
  onRemoveTurn: (turnId: string) => void;
  hasPendingChanges: boolean;
  save: () => Promise<boolean>;
};

export function useDialogueBlockEditingSession({
  block,
  isActive,
  isSaving,
  updateBlock,
  onComplete,
  sideEffects,
}: DialogueBlockEditingSessionParams): DialogueBlockEditingSession {
  const dialogueEditing = useDialogueEditingState({
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
    turns: dialogueEditing.turns,
    onChangeTurn: dialogueEditing.onChangeTurn,
    onAddTurn: dialogueEditing.onAddTurn,
    onRemoveTurn: dialogueEditing.onRemoveTurn,
    hasPendingChanges: dialogueEditing.hasPendingChanges,
    save: dialogueEditing.save,
  };
}
