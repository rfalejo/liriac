import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchChapterContextVisibility,
  type ChapterContextVisibilityResponse,
  type ChapterContextVisibilityUpdatePayload,
  updateChapterContextVisibility,
} from "../../../api/chapters";
import { editorQueryKeys } from "../editorQueryKeys";

export function useChapterContextVisibility(chapterId: string | null) {
  const enabled = Boolean(chapterId);

  return useQuery<ChapterContextVisibilityResponse>({
    queryKey: enabled
      ? editorQueryKeys.chapterContextVisibility(chapterId!)
      : ["editor", "chapter-context-visibility", "disabled"],
    queryFn: () => fetchChapterContextVisibility(chapterId!),
    enabled,
    staleTime: 60_000,
  });
}

export function useUpdateChapterContextVisibility(chapterId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ChapterContextVisibilityUpdatePayload) => {
      if (!chapterId) {
        throw new Error("Cannot update context visibility without a chapter id");
      }

      return updateChapterContextVisibility({
        chapterId,
        payload,
      });
    },
    onSuccess: (data) => {
      if (!chapterId) {
        return;
      }

      queryClient.setQueryData(
        editorQueryKeys.chapterContextVisibility(chapterId),
        data,
      );
    },
  });
}
