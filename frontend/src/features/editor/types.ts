import type { components } from "../../api/schema";

export type ChapterBlock = components["schemas"]["ChapterBlock"];
export type DialogueTurn = components["schemas"]["DialogueTurn"];
export type DialogueField = "speakerName" | "utterance" | "stageDirection";

type BaseEditingState<TType extends ChapterBlock["type"]> = {
  blockId: string;
  blockType: TType;
  onCancel: () => void;
  onSave: () => void;
  onDelete?: () => void;
  isSaving: boolean;
  hasPendingChanges: boolean;
};

export type ParagraphEditingState = BaseEditingState<"paragraph"> & {
  paragraph: {
    draftText: string;
    onChangeDraft: (value: string) => void;
  };
};

export type DialogueEditingState = BaseEditingState<"dialogue"> & {
  dialogue: {
    turns: DialogueTurn[];
    onChangeTurn: (turnId: string, field: DialogueField, value: string) => void;
    onAddTurn: () => void;
    onRemoveTurn: (turnId: string) => void;
  };
};

export type SceneBoundaryEditableField = "label" | "summary";

export type SceneBoundaryDraft = {
  label: string;
  summary: string;
};

export type SceneBoundaryEditingState = BaseEditingState<"scene_boundary"> & {
  sceneBoundary: {
    draft: SceneBoundaryDraft;
    onChangeField: (field: SceneBoundaryEditableField, value: string) => void;
  };
};

export type MetadataEditableField =
  | "title"
  | "subtitle"
  | "epigraph"
  | "epigraphAttribution"
  | "context"
  | "text";

export type MetadataDraft = {
  title: string;
  subtitle: string;
  epigraph: string;
  epigraphAttribution: string;
  context: string;
  text: string;
};

export type MetadataKindOption = "metadata" | "context" | "chapter_header";

export type MetadataEditingState = BaseEditingState<"metadata"> & {
  metadata: {
    kind: MetadataKindOption;
    draft: MetadataDraft;
    onChangeField: (field: MetadataEditableField, value: string) => void;
    onChangeKind: (nextKind: MetadataKindOption) => void;
  };
};

export type EditingState =
  | ParagraphEditingState
  | DialogueEditingState
  | SceneBoundaryEditingState
  | MetadataEditingState;
