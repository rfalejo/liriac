import { Fragment } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type {
  ChapterBlockEntry,
  ChapterBlockType,
} from "../hooks/useChapterBlocks";
import {
  BlockInsertMenu,
  type BlockInsertPosition,
} from "../blocks/BlockInsertMenu";
import { getNarrativeBlockSpacing } from "../utils/blockSpacing";
import { useEditorBlockEditing } from "../context/EditorBlockEditingContext";

export type ChapterBlockListProps = {
  blockEntries: ChapterBlockEntry[];
  onInsertBlock?: (
    blockType: ChapterBlockType,
    position: BlockInsertPosition,
  ) => void;
  onOpenConversion?: () => void;
  conversionDisabled?: boolean;
};

export function ChapterBlockList({
  blockEntries,
  onInsertBlock,
  onOpenConversion,
  conversionDisabled,
}: ChapterBlockListProps) {
  const { editingState } = useEditorBlockEditing();
  const activeBlockId = editingState?.blockId ?? null;

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
                onOpenConversion={onOpenConversion}
                conversionDisabled={conversionDisabled}
              />
            ) : null}
            <Box
              sx={() => {
                const previousEntry = index > 0 ? blockEntries[index - 1] : null;
                const previousType = previousEntry?.type ?? null;
                const isActive = entry.id === activeBlockId;
                const previousIsActive = previousEntry?.id === activeBlockId;

                let marginTop = index === 0 ? 0 : getNarrativeBlockSpacing(previousType, entry.type);

                if (isActive && index > 0) {
                  marginTop = Math.max(marginTop, 0.75);
                }

                if (previousIsActive) {
                  marginTop = Math.max(marginTop, 0.75);
                }

                return {
                  mt: marginTop,
                  mb: isActive ? 0.5 : 0,
                };
              }}
            >
              {entry.node}
            </Box>
            {onInsertBlock && index === blockEntries.length - 1 ? (
              <BlockInsertMenu
                position={{
                  afterBlockId: entry.id,
                  beforeBlockId: null,
                  index: index + 1,
                }}
                onInsertBlock={onInsertBlock}
                onOpenConversion={onOpenConversion}
                conversionDisabled={conversionDisabled}
              />
            ) : null}
          </Fragment>
        );
      })}
    </Stack>
  );
}
