import { useMemo } from "react";
import type { ReactNode } from "react";
import type { ChapterDetail } from "../../../api/chapters";
import type { components } from "../../../api/schema";
import { renderEditorBlock } from "../blocks/blockRegistry";

export type ChapterBlockType = components["schemas"]["ChapterBlockTypeEnum"];

export type ChapterBlockEntry = {
  id: string;
  node: ReactNode;
};

export type ChapterBlocksResult = {
  blockEntries: ChapterBlockEntry[];
  hasChapterHeader: boolean;
};

export function useChapterBlocks(
  chapter: ChapterDetail | null,
): ChapterBlocksResult {
  return useMemo(() => {
    if (!chapter) {
      return { blockEntries: [], hasChapterHeader: false };
    }

    let hasHeader = false;

    const blockEntries: ChapterBlockEntry[] = [];

    for (const block of chapter.blocks ?? []) {
      if (!block) {
        continue;
      }

      if (
        block.type === "metadata" &&
        (block.kind ?? "metadata") === "chapter_header"
      ) {
        hasHeader = true;
      }

      const rendered = renderEditorBlock({
        block,
      });

      if (rendered) {
        blockEntries.push({ id: block.id, node: rendered });
      }
    }

    return { blockEntries, hasChapterHeader: hasHeader };
  }, [chapter]);
}
