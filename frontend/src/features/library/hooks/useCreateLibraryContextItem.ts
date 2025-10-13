import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createBookContextItem,
  type ContextItemCreate,
  type LibraryResponse,
} from "../../../api/library";
import { libraryQueryKeys } from "../libraryQueryKeys";

export function useCreateLibraryContextItem(bookId: string | null) {
  const queryClient = useQueryClient();

  return useMutation<LibraryResponse, Error, ContextItemCreate>({
    mutationFn: async (itemPayload) => {
      if (!bookId) {
        throw new Error("Cannot create context items without a book id");
      }
      return createBookContextItem(bookId, itemPayload);
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
