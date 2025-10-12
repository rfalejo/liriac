import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChapterDetail } from "../../../api/chapters";
import { fetchChapterDetail } from "../../../api/chapters";
import { chapterQueryKeys } from "../libraryQueryKeys";

export function useChapterDetail(chapterId: string | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () =>
      chapterId
        ? chapterQueryKeys.detail(chapterId)
        : chapterQueryKeys.detailPlaceholder(),
    [chapterId],
  );

  const chapterQuery = useQuery<ChapterDetail, Error>({
    queryKey,
    queryFn: async () => {
      if (!chapterId) {
        throw new Error("Missing chapter identifier");
      }

      return fetchChapterDetail(chapterId);
    },
    enabled: Boolean(chapterId),
    placeholderData: () => {
      if (!chapterId) {
        return undefined;
      }

      return queryClient.getQueryData<ChapterDetail>(
        chapterQueryKeys.detail(chapterId),
      );
    },
  });

  const reload = useCallback(() => {
    if (!chapterId) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: chapterQueryKeys.detail(chapterId),
    });
  }, [chapterId, queryClient]);

  return {
    chapter: chapterQuery.data ?? null,
    loading: chapterQuery.isPending || chapterQuery.isFetching,
    error: chapterQuery.error ?? null,
    reload,
  };
}
