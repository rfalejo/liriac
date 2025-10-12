import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChapterDetail } from "../../api/chapters";
import type { ChapterSummary, LibraryBook } from "../../api/library";
import { useLibraryData } from "../library/LibraryDataContext";
import { useChapterDetail } from "../library/useChapterDetail";

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

  const relatedBook = useMemo<LibraryBook | null>(() => {
    if (!books.length) {
      return null;
    }

    if (chapter?.bookId) {
      const foundByChapter = books.find((book) => book.id === chapter.bookId);
      if (foundByChapter) {
        return foundByChapter;
      }
    }

    if (activeChapterId) {
      const foundByActiveId = books.find((book) =>
        book.chapters.some((item) => item.id === activeChapterId),
      );
      if (foundByActiveId) {
        return foundByActiveId;
      }
    }

    return null;
  }, [books, chapter?.bookId, activeChapterId]);

  const chapterOptions = useMemo<ChapterSummary[]>(
    () => relatedBook?.chapters ?? [],
    [relatedBook],
  );

  const bookTitle = chapter?.bookTitle ?? relatedBook?.title ?? null;

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
