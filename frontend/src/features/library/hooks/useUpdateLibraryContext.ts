import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ContextItemUpdate,
  type LibraryResponse,
  type PatchedContextItemsUpdateRequest,
  updateBookContextItems,
} from "../../../api/library";
import { libraryQueryKeys } from "../libraryQueryKeys";

export type UpdateLibraryContextVariables = ContextItemUpdate[];

export function useUpdateLibraryContext(bookId: string | null) {
  const queryClient = useQueryClient();

  return useMutation<LibraryResponse, Error, UpdateLibraryContextVariables>({
    mutationFn: async (items) => {
      if (!bookId) {
        throw new Error("Cannot update context without a book id");
      }
      const payload: PatchedContextItemsUpdateRequest = { items };
      return updateBookContextItems(bookId, payload);
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
