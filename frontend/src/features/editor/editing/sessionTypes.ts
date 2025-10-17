import type {
  DialogueTurn,
  MetadataDraft,
  MetadataKindOption,
  SceneBoundaryDraft,
} from "../types";

type ParagraphSessionBase = {
  type: "paragraph";
  blockId: string;
  draftText: string;
  baselineText: string;
};

type DialogueSessionBase = {
  type: "dialogue";
  blockId: string;
  draftTurns: DialogueTurn[];
  baselineTurns: DialogueTurn[];
};

type SceneBoundarySessionBase = {
  type: "scene_boundary";
  blockId: string;
  draft: SceneBoundaryDraft;
  baseline: SceneBoundaryDraft;
};

type MetadataSessionBase = {
  type: "metadata";
  blockId: string;
  draft: MetadataDraft;
  baseline: MetadataDraft;
  kind: MetadataKindOption;
  baselineKind: MetadataKindOption;
};

export type ParagraphSessionState = ParagraphSessionBase;
export type DialogueSessionState = DialogueSessionBase;
export type SceneBoundarySessionState = SceneBoundarySessionBase;
export type MetadataSessionState = MetadataSessionBase;

export type InternalSessionState =
  | ParagraphSessionState
  | DialogueSessionState
  | SceneBoundarySessionState
  | MetadataSessionState;
