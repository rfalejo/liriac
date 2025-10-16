import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import type { ChapterDetail } from "../../api/chapters";
import type { EditingState } from "./types";
import { EditorBlockEditingProvider } from "./context/EditorBlockEditingContext";
import type { BlockInsertPosition } from "./blocks/BlockInsertMenu";
import {
  useChapterBlocks,
  type ChapterBlockType,
} from "./hooks/useChapterBlocks";
import { ChapterLoadingState } from "./chapter/ChapterLoadingState";
import { ChapterErrorState } from "./chapter/ChapterErrorState";
import { ChapterEmptyState } from "./chapter/ChapterEmptyState";
import { ChapterHeading } from "./chapter/ChapterHeading";
import { ChapterBlockList } from "./chapter/ChapterBlockList";
import type { DraftBlockConversion } from "./hooks/useBlockConversion";

type EditorChapterViewProps = {
  loading: boolean;
  error: Error | null;
  chapter: ChapterDetail | null;
  onRetry: () => void;
  onEditBlock: (blockId: string) => void;
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
  editingState?: EditingState;
};

export function EditorChapterView({
  loading,
  error,
  chapter,
  onRetry,
  onEditBlock,
  onInsertBlock,
  onOpenConversion,
  conversionDisabled,
  conversionDraft,
  conversionApplying,
  conversionApplyError,
  onAcceptConversion,
  onRejectConversion,
  editingState,
}: EditorChapterViewProps) {
  const { blockEntries, hasChapterHeader } = useChapterBlocks(chapter);
  const theme = useTheme();
  const isTouchViewport = useMediaQuery(theme.breakpoints.down("sm"));
  const [longPressBlockId, setLongPressBlockId] = useState<string | null>(null);

  useEffect(() => {
    if (!isTouchViewport) {
      setLongPressBlockId(null);
    }
  }, [isTouchViewport]);

  useEffect(() => {
    if (!isTouchViewport) {
      return;
    }

    const handleGlobalPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }
      if (target.closest("[data-editor-block-insert-menu='true']")) {
        return;
      }
      if (target.closest("[data-editor-block-id]") || target.closest("[data-editor-block-controls]") ) {
        return;
      }
      setLongPressBlockId(null);
    };

    window.addEventListener("pointerdown", handleGlobalPointerDown, {
      passive: true,
    });

    return () => {
      window.removeEventListener("pointerdown", handleGlobalPointerDown);
    };
  }, [isTouchViewport]);

  useEffect(() => {
    if (!editingState?.blockId) {
      return;
    }
    setLongPressBlockId(null);
  }, [editingState?.blockId]);

  const handleLongPressBlock = useCallback((blockId: string) => {
    setLongPressBlockId(blockId);
  }, []);

  const handleClearLongPress = useCallback(() => {
    setLongPressBlockId(null);
  }, []);

  const longPressValue = useMemo(
    () => ({
      onLongPressBlock: isTouchViewport ? handleLongPressBlock : undefined,
      longPressBlockId: isTouchViewport ? longPressBlockId : null,
      clearLongPress: isTouchViewport ? handleClearLongPress : undefined,
    }),
    [handleClearLongPress, handleLongPressBlock, isTouchViewport, longPressBlockId],
  );

  if (loading) {
    return <ChapterLoadingState />;
  }

  if (error) {
    return <ChapterErrorState onRetry={onRetry} />;
  }

  if (!chapter) {
    return null;
  }

  return (
    <EditorBlockEditingProvider
      editingState={editingState}
      onEditBlock={onEditBlock}
      {...longPressValue}
    >
      <Fragment>
        {!hasChapterHeader ? (
          <ChapterHeading
            summary={chapter.summary ?? null}
            title={chapter.title}
          />
        ) : null}

        {blockEntries.length === 0 ? (
          <ChapterEmptyState
            onInsertBlock={onInsertBlock}
            onOpenConversion={onOpenConversion}
            conversionDisabled={conversionDisabled}
            conversionDraft={conversionDraft}
            conversionApplying={conversionApplying}
            conversionApplyError={conversionApplyError}
            onAcceptConversion={onAcceptConversion}
            onRejectConversion={onRejectConversion}
          />
        ) : (
          <ChapterBlockList
            blockEntries={blockEntries}
            onInsertBlock={onInsertBlock}
            onOpenConversion={onOpenConversion}
            conversionDisabled={conversionDisabled}
            conversionDraft={conversionDraft}
            conversionApplying={conversionApplying}
            conversionApplyError={conversionApplyError}
            onAcceptConversion={onAcceptConversion}
            onRejectConversion={onRejectConversion}
          />
        )}
      </Fragment>
    </EditorBlockEditingProvider>
  );
}
