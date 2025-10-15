import { useMemo } from "react";
import type { ReactNode } from "react";
import type { ChapterDetail } from "../../../api/chapters";
import type { components } from "../../../api/schema";
import { renderEditorBlock } from "../blocks/blockRegistry";

export type ChapterBlockType = components["schemas"]["ChapterBlockTypeEnum"];

export type ChapterBlockEntry = {
  id: string;
  node: ReactNode;
  type: ChapterBlockType;
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
    let hasFirstParagraph = false;

    const chapterBlocks = chapter.blocks ?? [];

    chapterBlocks.forEach((block, index) => {
      if (!block) {
        return;
      }

      if (
        block.type === "metadata" &&
        (block.kind ?? "metadata") === "chapter_header"
      ) {
        hasHeader = true;
      }

      let isFirstParagraph = false;
      if (!hasFirstParagraph && block.type === "paragraph") {
        const text = block.text?.trim() ?? "";
        if (text.length > 0) {
          isFirstParagraph = true;
          hasFirstParagraph = true;
        }
      }

      const rendered = renderEditorBlock({
        block,
        index,
        isFirstParagraph,
      });

      if (rendered) {
        blockEntries.push({ id: block.id, node: rendered, type: block.type });
      }
    });

    return { blockEntries, hasChapterHeader: hasHeader };
  }, [chapter]);
}
