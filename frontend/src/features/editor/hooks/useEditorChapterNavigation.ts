import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChapterDetail } from "../../../api/chapters";
import type { ChapterSummary } from "../../../api/library";
import { useLibraryData } from "../../library/LibraryDataContext";
import { useChapterDetail } from "../../library/hooks/useChapterDetail";
import { useBookLookup } from "../../library/hooks/useBookLookup";

type UseEditorChapterNavigationParams = {
  chapterId: string;
};

type EditorChapterNavigationResult = {
  activeChapterId: string | null;
  chapter: ChapterDetail | null;
  chapterOptions: ChapterSummary[];
  booksError: Error | null;
  booksLoading: boolean;
  bookTitle: string | null;
  contentSignature: string;
  error: Error | null;
  handleSelectChapter: (nextChapterId: string) => void;
  loading: boolean;
  reload: () => void;
};

export function useEditorChapterNavigation({
  chapterId,
}: UseEditorChapterNavigationParams): EditorChapterNavigationResult {
  const [activeChapterId, setActiveChapterId] = useState<string | null>(
    () => chapterId,
  );

  useEffect(() => {
    setActiveChapterId(chapterId);
  }, [chapterId]);

  const { books, booksLoading, booksError } = useLibraryData();
  const { chapter, loading, error, reload } = useChapterDetail(activeChapterId);

  // Use the new book lookup hook to resolve the book
  const { book, bookTitle: lookupBookTitle } = useBookLookup({
    books,
    chapterId: activeChapterId,
    bookId: chapter?.bookId,
  });

  const chapterOptions = useMemo<ChapterSummary[]>(
    () => book?.chapters ?? [],
    [book],
  );

  const bookTitle = chapter?.bookTitle ?? lookupBookTitle;

  const handleSelectChapter = useCallback(
    (nextChapterId: string) => {
      if (nextChapterId === activeChapterId) {
        return;
      }
      setActiveChapterId(nextChapterId);
    },
    [activeChapterId],
  );

  const contentSignature = useMemo(() => {
    if (!chapter || !activeChapterId) {
      return `${activeChapterId ?? "unknown"}-empty`;
    }
    return `${chapter.id}:${chapter.blocks.length}`;
  }, [chapter, activeChapterId]);

  return {
    activeChapterId,
    chapter,
    chapterOptions,
    booksError,
    booksLoading,
    bookTitle,
    contentSignature,
    error,
    handleSelectChapter,
    loading,
    reload,
  };
}
