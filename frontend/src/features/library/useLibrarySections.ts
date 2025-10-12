import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LibraryResponse } from "../../api/library";
import { fetchLibrarySections } from "../../api/library";
import { libraryQueryKeys } from "./libraryQueryKeys";

export function useLibrarySections() {
  const queryClient = useQueryClient();
  const sectionsQuery = useQuery<
    LibraryResponse,
    Error,
    LibraryResponse["sections"]
  >({
    queryKey: libraryQueryKeys.sections(),
    queryFn: fetchLibrarySections,
    select: (response) => response.sections,
  });

  const reload = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: libraryQueryKeys.sections(),
    });
  }, [queryClient]);

  return {
    sections: sectionsQuery.data ?? [],
    loading: sectionsQuery.isPending || sectionsQuery.isFetching,
    error: sectionsQuery.error ?? null,
    reload,
  };
}
