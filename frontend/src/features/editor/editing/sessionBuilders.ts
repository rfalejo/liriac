import { cloneTurns } from "../utils/dialogueTurns";
import type {
  ChapterBlock,
  MetadataDraft,
  MetadataEditableField,
  MetadataKindOption,
  SceneBoundaryDraft,
} from "../types";
import type {
  DialogueSessionState,
  MetadataSessionState,
  ParagraphSessionState,
  SceneBoundarySessionState,
} from "./sessionTypes";
import type { ParagraphSuggestionContext } from "./paragraphSuggestions.types";

const EMPTY_SCENE_BOUNDARY: SceneBoundaryDraft = {
  label: "",
  summary: "",
  locationName: "",
  timestamp: "",
  mood: "",
};

const EMPTY_METADATA: MetadataDraft = {
  title: "",
  subtitle: "",
  epigraph: "",
  epigraphAttribution: "",
  context: "",
  text: "",
  povCharacterName: "",
  timelineMarker: "",
  locationName: "",
  themeTags: "",
};

type EditableChapterBlock = ChapterBlock & {
  type: "paragraph" | "dialogue" | "scene_boundary" | "metadata";
};

export function isEditableBlock(block: ChapterBlock | null): block is EditableChapterBlock {
  if (!block) {
    return false;
  }
  return (
    block.type === "paragraph" ||
    block.type === "dialogue" ||
    block.type === "scene_boundary" ||
    block.type === "metadata"
  );
}

export function toSceneBoundaryDraft(block: ChapterBlock | null): SceneBoundaryDraft {
  if (!block || block.type !== "scene_boundary") {
    return { ...EMPTY_SCENE_BOUNDARY };
  }
  return {
    label: block.label ?? "",
    summary: block.summary ?? "",
    locationName: block.sceneDetails?.locationName ?? block.locationName ?? "",
    timestamp: block.sceneDetails?.timestamp ?? block.timestamp ?? "",
    mood: block.sceneDetails?.mood ?? block.mood ?? "",
  } satisfies SceneBoundaryDraft;
}

export function normalizeMetadataKind(kind: unknown): MetadataKindOption {
  if (kind === "chapter_header" || kind === "context" || kind === "metadata") {
    return kind;
  }
  return "metadata";
}

export function toMetadataDraft(block: ChapterBlock | null): MetadataDraft {
  if (!block || block.type !== "metadata") {
    return { ...EMPTY_METADATA };
  }

  const themeTags =
    (block.narrativeContext?.themeTags ?? block.themeTags ?? [])
      .filter((tag): tag is string => Boolean(tag && tag.trim().length > 0))
      .join(", ");

  return {
    title: block.title ?? "",
    subtitle: block.subtitle ?? "",
    epigraph: block.epigraph ?? "",
    epigraphAttribution: block.epigraphAttribution ?? "",
    context: block.context ?? "",
    text: block.text ?? "",
    povCharacterName:
      block.narrativeContext?.povCharacterName ?? block.povCharacterName ?? "",
    timelineMarker:
      block.narrativeContext?.timelineMarker ?? block.timelineMarker ?? "",
    locationName:
      block.narrativeContext?.locationName ?? block.locationName ?? "",
    themeTags,
  } satisfies MetadataDraft;
}

export function metadataFieldValue(
  block: ChapterBlock | null,
  field: MetadataEditableField,
): string {
  if (!block || block.type !== "metadata") {
    return "";
  }
  switch (field) {
    case "title":
      return block.title ?? "";
    case "subtitle":
      return block.subtitle ?? "";
    case "epigraph":
      return block.epigraph ?? "";
    case "epigraphAttribution":
      return block.epigraphAttribution ?? "";
    case "context":
      return block.context ?? "";
    case "povCharacterName":
      return (
        block.narrativeContext?.povCharacterName ??
        block.povCharacterName ??
        ""
      );
    case "timelineMarker":
      return (
        block.narrativeContext?.timelineMarker ??
        block.timelineMarker ??
        ""
      );
    case "locationName":
      return (
        block.narrativeContext?.locationName ??
        block.locationName ??
        block.narrativeContext?.locationId ??
        block.locationId ??
        ""
      );
    case "themeTags":
      return (
        block.narrativeContext?.themeTags ?? block.themeTags ?? []
      )
        .filter((tag): tag is string => Boolean(tag && tag.trim().length > 0))
        .join(", ");
    case "text":
    default:
      return block.text ?? "";
  }
}

export function getRelevantMetadataFields(kind: MetadataKindOption): MetadataEditableField[] {
  if (kind === "chapter_header") {
    return ["title", "subtitle", "epigraph", "epigraphAttribution"];
  }
  if (kind === "context") {
    return ["context", "povCharacterName", "timelineMarker", "locationName", "themeTags"];
  }
  return ["text"];
}

export function buildParagraphSession(
  block: ChapterBlock,
  suggestionContext: ParagraphSuggestionContext,
): ParagraphSessionState {
  if (block.type !== "paragraph") {
    throw new Error("Attempted to build paragraph session for non-paragraph block");
  }
  return {
    type: "paragraph",
    blockId: block.id,
    draftText: block.text ?? "",
    baselineText: block.text ?? "",
    suggestionContext,
  } satisfies ParagraphSessionState;
}

export function buildDialogueSession(block: ChapterBlock): DialogueSessionState {
  if (block.type !== "dialogue") {
    throw new Error("Attempted to build dialogue session for non-dialogue block");
  }
  const turns = cloneTurns(block.turns ?? []);
  return {
    type: "dialogue",
    blockId: block.id,
    draftTurns: turns,
    baselineTurns: cloneTurns(block.turns ?? []),
  } satisfies DialogueSessionState;
}

export function buildSceneBoundarySession(block: ChapterBlock): SceneBoundarySessionState {
  if (block.type !== "scene_boundary") {
    throw new Error("Attempted to build scene boundary session for incompatible block");
  }
  const draft = toSceneBoundaryDraft(block);
  return {
    type: "scene_boundary",
    blockId: block.id,
    draft,
    baseline: { ...draft },
  } satisfies SceneBoundarySessionState;
}

export function buildMetadataSession(block: ChapterBlock): MetadataSessionState {
  if (block.type !== "metadata") {
    throw new Error("Attempted to build metadata session for incompatible block");
  }
  const draft = toMetadataDraft(block);
  const kind = normalizeMetadataKind(block.kind);
  return {
    type: "metadata",
    blockId: block.id,
    draft,
    baseline: { ...draft },
    kind,
    baselineKind: kind,
  } satisfies MetadataSessionState;
}

export function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
