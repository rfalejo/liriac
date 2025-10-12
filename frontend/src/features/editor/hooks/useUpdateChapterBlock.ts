import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  chapterQueryKeys,
  libraryQueryKeys,
} from "../../library/libraryQueryKeys";
import {
  type ChapterBlockUpdatePayload,
  updateChapterBlock,
} from "../../../api/chapters";
import type { ChapterDetail } from "../../../api/chapters";

type UseUpdateChapterBlockParams = {
  chapterId: string | null | undefined;
};

type UpdateArgs = {
  blockId: string;
  payload: ChapterBlockUpdatePayload;
};

type UseUpdateChapterBlockResult = {
  updateBlock: (args: UpdateArgs) => Promise<ChapterDetail>;
  isPending: boolean;
};

export function useUpdateChapterBlock({
  chapterId,
}: UseUpdateChapterBlockParams): UseUpdateChapterBlockResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ blockId, payload }: UpdateArgs) => {
      if (!chapterId) {
        throw new Error("Missing chapter identifier for block update");
      }

      return updateChapterBlock({
        chapterId,
        blockId,
        payload,
      });
    },
    onSuccess: (updatedChapter) => {
      if (!chapterId) {
        return;
      }

      queryClient.setQueryData<ChapterDetail>(
        chapterQueryKeys.detail(chapterId),
        updatedChapter,
      );

      // Refresh cached lists so metadata stays aligned when summaries change.
      void queryClient.invalidateQueries({
        queryKey: libraryQueryKeys.books(),
        exact: false,
      });
    },
  });

  const updateBlock = useCallback(
    (args: UpdateArgs) => mutation.mutateAsync(args),
    [mutation],
  );

  return {
    updateBlock,
    isPending: mutation.isPending,
  };
}
