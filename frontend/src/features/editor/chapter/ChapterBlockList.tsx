import { Fragment } from "react";
import { Stack } from "@mui/material";
import type {
  ChapterBlockEntry,
  ChapterBlockType,
} from "../hooks/useChapterBlocks";
import {
  BlockInsertMenu,
  type BlockInsertPosition,
} from "../blocks/BlockInsertMenu";

export type ChapterBlockListProps = {
  blockEntries: ChapterBlockEntry[];
  onInsertBlock?: (
    blockType: ChapterBlockType,
    position: BlockInsertPosition,
  ) => void;
};

export function ChapterBlockList({
  blockEntries,
  onInsertBlock,
}: ChapterBlockListProps) {
  if (blockEntries.length === 0) {
    return null;
  }

  return (
    <Stack spacing={0}>
      {blockEntries.map((entry, index) => {
        const previous = blockEntries[index - 1];
        const insertPosition: BlockInsertPosition = {
          afterBlockId: previous?.id ?? null,
          beforeBlockId: entry.id,
          index,
        };

        return (
          <Fragment key={entry.id}>
            {onInsertBlock && index > 0 ? (
              <BlockInsertMenu
                position={insertPosition}
                onInsertBlock={onInsertBlock}
              />
            ) : null}
            {entry.node}
          </Fragment>
        );
      })}
    </Stack>
  );
}
