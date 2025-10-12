import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LibraryBook, LibraryBooksResponse } from "../../api/library";
import { fetchLibraryBooks } from "../../api/library";
import { libraryQueryKeys } from "./libraryQueryKeys";

export function useLibraryBooks() {
  const queryClient = useQueryClient();
  const booksQuery = useQuery<LibraryBooksResponse, Error, LibraryBook[]>({
    queryKey: libraryQueryKeys.books(),
    queryFn: fetchLibraryBooks,
    select: (response) => response.books,
  });

  const reload = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: libraryQueryKeys.books() });
  }, [queryClient]);

  return {
    books: booksQuery.data ?? [],
    loading: booksQuery.isPending || booksQuery.isFetching,
    error: booksQuery.error ?? null,
    reload,
  };
}
