import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  createChapterBlock,
  type ChapterBlockCreatePayload,
  type ChapterDetail,
} from "../../../api/chapters";
import {
  chapterQueryKeys,
  libraryQueryKeys,
} from "../../library/libraryQueryKeys";

type UseCreateChapterBlockParams = {
  chapterId: string | null | undefined;
};

type CreateArgs = {
  payload: ChapterBlockCreatePayload;
};

type UseCreateChapterBlockResult = {
  createBlock: (args: CreateArgs) => Promise<ChapterDetail>;
  isPending: boolean;
};

export function useCreateChapterBlock({
  chapterId,
}: UseCreateChapterBlockParams): UseCreateChapterBlockResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ payload }: CreateArgs) => {
      if (!chapterId) {
        throw new Error("Missing chapter identifier for block creation");
      }

      return createChapterBlock({
        chapterId,
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

      void queryClient.invalidateQueries({
        queryKey: libraryQueryKeys.books(),
        exact: false,
      });
    },
  });

  const createBlock = useCallback(
    (args: CreateArgs) => mutation.mutateAsync(args),
    [mutation],
  );

  return {
    createBlock,
    isPending: mutation.isPending,
  };
}
