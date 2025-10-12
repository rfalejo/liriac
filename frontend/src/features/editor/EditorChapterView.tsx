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
  editingState?: EditingState;
};

export function EditorChapterView({
  loading,
  error,
  chapter,
  onRetry,
  onEditBlock,
  onInsertBlock,
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
          <ChapterEmptyState />
        ) : (
          <ChapterBlockList
            blockEntries={blockEntries}
            onInsertBlock={onInsertBlock}
          />
        )}
      </Fragment>
    </EditorBlockEditingProvider>
  );
}
