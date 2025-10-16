import { Fragment } from "react";
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
