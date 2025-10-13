import type { components } from "../../../api/schema";
import type { ChapterBlockCreatePayload } from "../../../api/chapters";
import { generateTurnId } from "./dialogueTurns";

type ChapterBlockType = components["schemas"]["ChapterBlockTypeEnum"];

export function generateBlockId(): string {
  const cryptoRef =
    typeof globalThis !== "undefined"
      ? (globalThis.crypto as Crypto | undefined)
      : undefined;
  if (cryptoRef && typeof cryptoRef.randomUUID === "function") {
    return cryptoRef.randomUUID();
  }
  return `local-block-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildDefaultBlockPayload(
  blockType: ChapterBlockType,
  blockId: string,
): ChapterBlockCreatePayload {
  if (blockType === "paragraph") {
    return {
      id: blockId,
      type: blockType,
      text: "",
      style: "narration",
      tags: [],
    };
  }

  if (blockType === "dialogue") {
    return {
      id: blockId,
      type: blockType,
      turns: [
        {
          id: generateTurnId(),
          speakerId: null,
          speakerName: "",
          utterance: "",
          stageDirection: null,
          tone: null,
        },
      ],
      context: null,
    };
  }

  if (blockType === "scene_boundary") {
    return {
      id: blockId,
      type: blockType,
      label: "",
      summary: "",
      locationId: null,
      locationName: null,
      timestamp: null,
      mood: null,
    };
  }

  return {
    id: blockId,
    type: "metadata",
    kind: "metadata",
    text: "",
  };
}

export function attachPosition(
  payload: ChapterBlockCreatePayload,
  position: {
    afterBlockId: string | null;
    beforeBlockId: string | null;
  },
  chapter: components["schemas"]["ChapterDetail"] | null,
): ChapterBlockCreatePayload {
  if (!chapter) {
    return payload;
  }

  const blocks = chapter.blocks ?? [];

  if (position.beforeBlockId) {
    const target = blocks.find((block) => block.id === position.beforeBlockId);
    if (target && typeof target.position === "number") {
      return {
        ...payload,
        position: target.position,
      };
    }
  }

  if (position.afterBlockId) {
    const target = blocks.find((block) => block.id === position.afterBlockId);
    if (target && typeof target.position === "number") {
      return {
        ...payload,
        position: target.position + 1,
      };
    }
  }

  const maxPosition = blocks.reduce<number | null>((acc, block) => {
    if (typeof block.position !== "number") {
      return acc;
    }
    if (acc === null) {
      return block.position;
    }
    return Math.max(acc, block.position);
  }, null);

  return {
    ...payload,
    position: typeof maxPosition === "number" ? maxPosition + 1 : 0,
  };
}
