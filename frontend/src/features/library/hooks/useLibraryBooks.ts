import { useMemo } from "react";
import type { LibraryBook, LibraryBooksResponse } from "../../../api/library";
import { fetchLibraryBooks } from "../../../api/library";
import { libraryQueryKeys } from "../libraryQueryKeys";
import { useLibraryResource } from "./useLibraryResource";

export function useLibraryBooks() {
  const booksQueryKey = useMemo(() => libraryQueryKeys.books(), []);

  const { data, loading, error, reload } = useLibraryResource<
    LibraryBooksResponse,
    LibraryBook[]
  >({
    queryKey: booksQueryKey,
    queryFn: fetchLibraryBooks,
    select: (response) => response.books,
    placeholderData: [],
  });

  return {
    books: data,
    loading,
    error,
    reload,
  };
}
