import { Fragment, useCallback } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { Theme } from "@mui/material/styles";
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
import { DraftConversionPreview } from "../conversions/DraftConversionPreview";
import type { DraftBlockConversion } from "../hooks/useBlockConversion";

export type ChapterBlockListProps = {
  blockEntries: ChapterBlockEntry[];
  onInsertBlock?: (
    blockType: ChapterBlockType,
    position: BlockInsertPosition,
  ) => void;
  onOpenConversion?: (position: BlockInsertPosition) => void;
  conversionDisabled?: boolean;
  conversionDraft?: DraftBlockConversion | null;
  conversionApplying?: boolean;
  conversionApplyError?: string | null;
  onAcceptConversion?: () => void;
  onRejectConversion?: () => void;
};

export function ChapterBlockList({
  blockEntries,
  onInsertBlock,
  onOpenConversion,
  conversionDisabled,
  conversionDraft,
  conversionApplying,
  conversionApplyError,
  onAcceptConversion,
  onRejectConversion,
}: ChapterBlockListProps) {
  const { editingState, longPressBlockId, clearLongPress } = useEditorBlockEditing();
  const isTouchViewport = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("sm"),
  );
  const activeBlockId = editingState?.blockId ?? null;

  if (blockEntries.length === 0) {
    return null;
  }

  const previewIndex = conversionDraft
    ? conversionDraft.position?.index ?? blockEntries.length
    : null;

  const renderPreview = (slotIndex: number) => {
    if (
      conversionDraft == null ||
      previewIndex == null ||
      previewIndex !== slotIndex
    ) {
      return null;
    }

    return (
      <Box
        sx={(theme) => ({
          width: "100%",
          mt: { xs: theme.spacing(1.5), sm: theme.spacing(2) },
          mb: { xs: theme.spacing(1.5), sm: theme.spacing(2) },
        })}
      >
        <DraftConversionPreview
          blocks={conversionDraft.blocks}
          onAccept={() => {
            onAcceptConversion?.();
          }}
          onReject={() => {
            onRejectConversion?.();
          }}
          accepting={Boolean(conversionApplying)}
          error={conversionApplyError ?? null}
        />
      </Box>
    );
  };

  const isSlotVisible = useCallback(
    (position: BlockInsertPosition) => {
      if (!isTouchViewport) {
        return true;
      }

      if (!longPressBlockId) {
        return false;
      }

      return (
        position.beforeBlockId === longPressBlockId ||
        position.afterBlockId === longPressBlockId
      );
    },
    [isTouchViewport, longPressBlockId],
  );

  const renderInsertSlot = (position: BlockInsertPosition) => {
    if (!onInsertBlock) {
      return renderPreview(position.index);
    }

    return (
      <Fragment>
        <BlockInsertMenu
          position={position}
          onInsertBlock={onInsertBlock}
          onOpenConversion={onOpenConversion}
          conversionDisabled={conversionDisabled}
          visible={isSlotVisible(position)}
          onRequestClose={isTouchViewport ? clearLongPress : undefined}
          longPressBlockId={isTouchViewport ? longPressBlockId : null}
        />
        {renderPreview(position.index)}
      </Fragment>
    );
  };

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
            {renderInsertSlot(insertPosition)}
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
            {index === blockEntries.length - 1
              ? renderInsertSlot({
                  afterBlockId: entry.id,
                  beforeBlockId: null,
                  index: index + 1,
                })
              : null}
          </Fragment>
        );
      })}
    </Stack>
  );
}
