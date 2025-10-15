import { useQuery } from "@tanstack/react-query";
import {
  fetchChapterBlockVersions,
  type ChapterBlockVersionList,
} from "../../../api/chapters";
import { editorQueryKeys } from "../editorQueryKeys";

type UseChapterBlockVersionsParams = {
  chapterId: string | null;
  blockId: string | null;
  enabled?: boolean;
};

export function useChapterBlockVersions({
  chapterId,
  blockId,
  enabled = true,
}: UseChapterBlockVersionsParams) {
  const shouldFetch = Boolean(enabled && chapterId && blockId);
  const keyChapter = chapterId ?? "__no-chapter__";
  const keyBlock = blockId ?? "__no-block__";
  const queryKey = editorQueryKeys.blockVersions(keyChapter, keyBlock);

  return useQuery<ChapterBlockVersionList>({
    queryKey,
    enabled: shouldFetch,
    queryFn: async () => {
      if (!chapterId || !blockId) {
        throw new Error("Missing identifiers for block versions request");
      }
      return fetchChapterBlockVersions({ chapterId, blockId });
    },
    staleTime: 30_000,
  });
}
