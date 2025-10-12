import { useCallback, useEffect, useMemo, useState } from "react";
import type { LibraryBook } from "../../../api/library";

type UseLibrarySelectionParams = {
  books: LibraryBook[];
  reloadBooks: () => void;
  reloadSections: () => void;
};

export function useLibrarySelection({
  books,
  reloadBooks,
  reloadSections,
}: UseLibrarySelectionParams) {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  useEffect(() => {
    if (books.length === 0) {
      setSelectedBookId(null);
      return;
    }

    setSelectedBookId((current) => {
      if (current && books.some((book) => book.id === current)) {
        return current;
      }
      return books[0].id;
    });
  }, [books]);

  const selectedBook = useMemo(
    () => books.find((book) => book.id === selectedBookId) ?? null,
    [books, selectedBookId],
  );

  const selectBook = useCallback((bookId: string) => {
    setSelectedBookId(bookId);
  }, []);

  const refreshLibrary = useCallback(() => {
    reloadBooks();
    reloadSections();
  }, [reloadBooks, reloadSections]);

  return {
    refreshLibrary,
    selectBook,
    selectedBook,
    selectedBookId,
  };
}
