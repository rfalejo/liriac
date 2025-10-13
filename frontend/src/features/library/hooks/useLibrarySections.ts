import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LibraryResponse } from "../../../api/library";
import { fetchBookContext } from "../../../api/library";
import { libraryQueryKeys } from "../libraryQueryKeys";

export function useLibrarySections(bookId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery<LibraryResponse, Error, LibraryResponse["sections"]>({
    queryKey: libraryQueryKeys.sections(bookId),
    queryFn: async () => {
      if (!bookId) {
        throw new Error("Missing book id");
      }
      return fetchBookContext(bookId);
    },
    select: (response) => response.sections,
    enabled: Boolean(bookId),
  });

  const reload = useCallback(() => {
    if (!bookId) {
      return;
    }
    void queryClient.invalidateQueries({
      queryKey: libraryQueryKeys.sections(bookId),
    });
  }, [bookId, queryClient]);

  const sections = useMemo<LibraryResponse["sections"]>(() => {
    if (!bookId) {
      return [];
    }
    return query.data ?? [];
  }, [bookId, query.data]);
  const loading = bookId ? query.isPending || query.isFetching : false;
  const error = bookId ? query.error ?? null : null;

  return {
    sections,
    loading,
    error,
    reload,
  };
}
