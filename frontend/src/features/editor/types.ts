import type { components } from "../../api/schema";

export type ChapterBlock = components["schemas"]["ChapterBlock"];
export type DialogueTurn = components["schemas"]["DialogueTurn"];
export type DialogueField = "speakerName" | "utterance" | "stageDirection";

export type ParagraphEditingState = {
  blockId: string;
  blockType: "paragraph";
  paragraph: {
    draftText: string;
    onChangeDraft: (value: string) => void;
  };
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
};

export type DialogueEditingState = {
  blockId: string;
  blockType: "dialogue";
  dialogue: {
    turns: DialogueTurn[];
    onChangeTurn: (turnId: string, field: DialogueField, value: string) => void;
    onAddTurn: () => void;
    onRemoveTurn: (turnId: string) => void;
  };
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
};

export type EditingState = ParagraphEditingState | DialogueEditingState;
