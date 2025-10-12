import { useMemo } from "react";
import type { LibraryBook } from "../../../api/library";

type UseBookLookupParams = {
  books: LibraryBook[];
  chapterId?: string | null;
  bookId?: string | null;
};

type BookLookupResult = {
  book: LibraryBook | null;
  bookTitle: string | null;
};

/**
 * Memoized hook that resolves a book from a chapter ID or book ID.
 * Caches the lookup to avoid repeated array scans.
 */
export function useBookLookup({
  books,
  chapterId,
  bookId,
}: UseBookLookupParams): BookLookupResult {
  const book = useMemo<LibraryBook | null>(() => {
    if (!books.length) {
      return null;
    }

    // First try to resolve by bookId if provided
    if (bookId) {
      const foundByBookId = books.find((book) => book.id === bookId);
      if (foundByBookId) {
        return foundByBookId;
      }
    }

    // Then try to resolve by chapterId if provided
    if (chapterId) {
      const foundByChapterId = books.find((book) =>
        book.chapters.some((chapter) => chapter.id === chapterId),
      );
      if (foundByChapterId) {
        return foundByChapterId;
      }
    }

    return null;
  }, [books, chapterId, bookId]);

  const bookTitle = book?.title ?? null;

  return { book, bookTitle };
}
