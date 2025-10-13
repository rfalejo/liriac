import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  deleteChapterBlock,
  type ChapterDetail,
} from "../../../api/chapters";
import {
  chapterQueryKeys,
  libraryQueryKeys,
} from "../../library/libraryQueryKeys";

type UseDeleteChapterBlockParams = {
  chapterId: string | null | undefined;
};

type DeleteArgs = {
  blockId: string;
};

type UseDeleteChapterBlockResult = {
  deleteBlock: (args: DeleteArgs) => Promise<ChapterDetail>;
  isPending: boolean;
};

export function useDeleteChapterBlock({
  chapterId,
}: UseDeleteChapterBlockParams): UseDeleteChapterBlockResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ blockId }: DeleteArgs) => {
      if (!chapterId) {
        throw new Error("Missing chapter identifier for block deletion");
      }

      return deleteChapterBlock({
        chapterId,
        blockId,
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

      void queryClient.invalidateQueries({
        queryKey: libraryQueryKeys.books(),
        exact: false,
      });
    },
  });

  const deleteBlock = useCallback(
    (args: DeleteArgs) => mutation.mutateAsync(args),
    [mutation],
  );

  return {
    deleteBlock,
    isPending: mutation.isPending,
  };
}
