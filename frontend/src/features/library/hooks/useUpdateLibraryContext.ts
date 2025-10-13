import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ContextItemUpdate,
  type LibraryResponse,
  type PatchedContextItemsUpdateRequest,
  updateLibraryContextItems,
} from "../../../api/library";
import { libraryQueryKeys } from "../libraryQueryKeys";

export type UpdateLibraryContextVariables = ContextItemUpdate[];

export function useUpdateLibraryContext() {
  const queryClient = useQueryClient();

  return useMutation<LibraryResponse, Error, UpdateLibraryContextVariables>({
    mutationFn: async (items) => {
      const payload: PatchedContextItemsUpdateRequest = { items };
      return updateLibraryContextItems(payload);
    },
    onSuccess: (response) => {
      queryClient.setQueryData(libraryQueryKeys.sections(), response.sections);
    },
  });
}
