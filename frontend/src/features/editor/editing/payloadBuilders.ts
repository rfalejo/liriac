import type { ChapterBlockUpdatePayload } from "../../../api/chapters";
import type {
  DialogueSessionState,
  MetadataSessionState,
  ParagraphSessionState,
  SceneBoundarySessionState,
} from "./sessionTypes";
import { toNullable } from "./sessionBuilders";

export function buildParagraphPayload(session: ParagraphSessionState): ChapterBlockUpdatePayload {
  return {
    text: session.draftText,
  } satisfies ChapterBlockUpdatePayload;
}

export function buildDialoguePayload(session: DialogueSessionState): ChapterBlockUpdatePayload {
  return {
    turns: session.draftTurns,
  } satisfies ChapterBlockUpdatePayload;
}

export function buildSceneBoundaryPayload(session: SceneBoundarySessionState): ChapterBlockUpdatePayload {
  return {
    label: toNullable(session.draft.label),
    summary: toNullable(session.draft.summary),
    sceneDetails: {
      locationName: toNullable(session.draft.locationName),
      timestamp: toNullable(session.draft.timestamp),
      mood: toNullable(session.draft.mood),
    },
  } satisfies ChapterBlockUpdatePayload;
}

export function buildMetadataPayload(session: MetadataSessionState): ChapterBlockUpdatePayload {
  const payload: ChapterBlockUpdatePayload = {
    kind: session.kind,
  };

  if (session.kind === "chapter_header") {
    payload.title = toNullable(session.draft.title);
    payload.subtitle = toNullable(session.draft.subtitle);
    payload.epigraph = toNullable(session.draft.epigraph);
    payload.epigraphAttribution = toNullable(session.draft.epigraphAttribution);
    payload.context = null;
    payload.text = "";
    payload.narrativeContext = null;
    payload.povCharacterName = null;
    payload.timelineMarker = null;
    payload.locationName = null;
    payload.themeTags = [];
  } else if (session.kind === "context") {
    payload.context = toNullable(session.draft.context);
    payload.title = null;
    payload.subtitle = null;
    payload.epigraph = null;
    payload.epigraphAttribution = null;
    payload.text = "";
    const normalizedTags = session.draft.themeTags
      .split(",")
      .map((entry: string) => entry.trim())
      .filter((entry: string) => entry.length > 0);
    payload.narrativeContext = {
      povCharacterName: toNullable(session.draft.povCharacterName),
      timelineMarker: toNullable(session.draft.timelineMarker),
      locationName: toNullable(session.draft.locationName),
      themeTags: normalizedTags,
    };
    payload.povCharacterName = null;
    payload.timelineMarker = null;
    payload.locationName = null;
    payload.themeTags = normalizedTags;
  } else {
    payload.text = session.draft.text;
    payload.title = null;
    payload.subtitle = null;
    payload.epigraph = null;
    payload.epigraphAttribution = null;
    payload.context = null;
    payload.narrativeContext = null;
    payload.povCharacterName = null;
    payload.timelineMarker = null;
    payload.locationName = null;
    payload.themeTags = [];
  }

  return payload;
}
