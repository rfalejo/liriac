import { useCallback, useMemo } from "react";
import type { ChapterDetail } from "../../../api/chapters";
import type { ChapterBlock } from "../types";

type ChapterBlockMap = Map<string, ChapterBlock>;

type ChapterBlockSelectors = {
  getBlockById: (blockId: string) => ChapterBlock | null;
  getDialogueBlock: (blockId: string) => ChapterBlock | null;
  getParagraphBlock: (blockId: string) => ChapterBlock | null;
};

const EMPTY_MAP: ChapterBlockMap = new Map();

export function useChapterBlockSelectors(chapter: ChapterDetail | null): ChapterBlockSelectors {
  const blockMap = useMemo<ChapterBlockMap>(() => {
    if (!chapter) {
      return EMPTY_MAP;
    }

    return new Map(chapter.blocks.map((block) => [block.id, block]));
  }, [chapter]);

  const getBlockById = useCallback<ChapterBlockSelectors["getBlockById"]>(
    (blockId) => blockMap.get(blockId) ?? null,
    [blockMap],
  );

  const getParagraphBlock = useCallback<ChapterBlockSelectors["getParagraphBlock"]>(
    (blockId) => {
      const block = getBlockById(blockId);
      return block?.type === "paragraph" ? block : null;
    },
    [getBlockById],
  );

  const getDialogueBlock = useCallback<ChapterBlockSelectors["getDialogueBlock"]>(
    (blockId) => {
      const block = getBlockById(blockId);
      return block?.type === "dialogue" ? block : null;
    },
    [getBlockById],
  );

  return {
    getBlockById,
    getDialogueBlock,
    getParagraphBlock,
  };
}
