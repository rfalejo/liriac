import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteChapterBlockVersion } from "../../../api/chapters";
import {
  chapterQueryKeys,
  libraryQueryKeys,
} from "../../library/libraryQueryKeys";
import { editorQueryKeys } from "../editorQueryKeys";

type UseDeleteChapterBlockVersionParams = {
  chapterId: string | null;
  blockId: string | null;
};

type DeleteArgs = {
  version: number;
};

export function useDeleteChapterBlockVersion({
  chapterId,
  blockId,
}: UseDeleteChapterBlockVersionParams) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ version }: DeleteArgs) => {
      if (!chapterId || !blockId) {
        throw new Error("Missing identifiers for block version deletion");
      }

      return deleteChapterBlockVersion({
        chapterId,
        blockId,
        version,
      });
    },
    onSuccess: (updatedChapter) => {
      if (chapterId) {
        queryClient.setQueryData(
          chapterQueryKeys.detail(chapterId),
          updatedChapter,
        );
      }

      if (chapterId && blockId) {
        void queryClient.invalidateQueries({
          queryKey: editorQueryKeys.blockVersions(chapterId, blockId),
        });
      }

      // Chapter summaries may change if the active version affects metadata.
      void queryClient.invalidateQueries({
        queryKey: libraryQueryKeys.books(),
        exact: false,
      });
    },
  });

  return {
    deleteVersion: (version: number) => mutation.mutateAsync({ version }),
    isPending: mutation.isPending,
  };
}
