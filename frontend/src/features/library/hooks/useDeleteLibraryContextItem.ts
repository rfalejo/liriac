import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteBookContextItem,
  type LibraryResponse,
} from "../../../api/library";
import { libraryQueryKeys } from "../libraryQueryKeys";

export type DeleteLibraryContextItemVariables = {
  sectionSlug: string;
  itemId: string;
  chapterId?: string | null;
};

export function useDeleteLibraryContextItem(bookId: string | null) {
  const queryClient = useQueryClient();

  return useMutation<LibraryResponse, Error, DeleteLibraryContextItemVariables>({
    mutationFn: async ({ sectionSlug, itemId, chapterId }) => {
      if (!bookId) {
        throw new Error("Cannot delete context items without a book id");
      }
      return deleteBookContextItem(bookId, sectionSlug, itemId, {
        chapterId: chapterId ?? undefined,
      });
    },
    onSuccess: (response) => {
      if (!bookId) {
        return;
      }
      queryClient.setQueryData<LibraryResponse>(
        libraryQueryKeys.sections(bookId),
        response,
      );
    },
  });
}
