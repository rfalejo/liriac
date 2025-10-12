import type { LibraryResponse } from "../../api/library";
import { fetchLibrarySections } from "../../api/library";
import { libraryQueryKeys } from "./libraryQueryKeys";
import { useLibraryResource } from "./useLibraryResource";

export function useLibrarySections() {
  const { data, loading, error, reload } = useLibraryResource<
    LibraryResponse,
    LibraryResponse["sections"]
  >({
    queryKey: libraryQueryKeys.sections(),
    queryFn: fetchLibrarySections,
    select: (response) => response.sections,
    placeholderData: [],
  });

  return {
    sections: data,
    loading,
    error,
    reload,
  };
}
