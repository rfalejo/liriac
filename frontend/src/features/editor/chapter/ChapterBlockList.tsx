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
        const insertPosition: BlockInsertPosition = {
          afterBlockId: index > 0 ? blockEntries[index - 1]?.id ?? null : null,
          beforeBlockId: entry.id,
          index,
        };

        return (
          <Fragment key={entry.id}>
            {onInsertBlock ? (
              <BlockInsertMenu
                position={insertPosition}
                onInsertBlock={onInsertBlock}
              />
            ) : null}
            {entry.node}
            {onInsertBlock && index === blockEntries.length - 1 ? (
              <BlockInsertMenu
                position={{
                  afterBlockId: entry.id,
                  beforeBlockId: null,
                  index: index + 1,
                }}
                onInsertBlock={onInsertBlock}
              />
            ) : null}
          </Fragment>
        );
      })}
    </Stack>
  );
}
