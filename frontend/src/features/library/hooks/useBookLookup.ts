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
  const lookupMaps = useMemo(() => {
    const bookById = new Map<string, LibraryBook>();
    const bookByChapterId = new Map<string, LibraryBook>();

    for (const book of books) {
      bookById.set(book.id, book);
      for (const chapter of book.chapters) {
        bookByChapterId.set(chapter.id, book);
      }
    }

    return { bookById, bookByChapterId };
  }, [books]);

  const book = useMemo<LibraryBook | null>(() => {
    if (bookId) {
      const match = lookupMaps.bookById.get(bookId);
      if (match) {
        return match;
      }
    }

    if (chapterId) {
      const match = lookupMaps.bookByChapterId.get(chapterId);
      if (match) {
        return match;
      }
    }

    return null;
  }, [bookId, chapterId, lookupMaps]);

  const bookTitle = book?.title ?? null;

  return { book, bookTitle };
}
