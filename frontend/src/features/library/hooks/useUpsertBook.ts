import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createLibraryBook,
  type BookUpsert,
  type LibraryBook,
  type LibraryBooksResponse,
  type PatchedBookUpsert,
  updateLibraryBook,
} from "../../../api/library";
import { libraryQueryKeys } from "../libraryQueryKeys";

export type UpsertBookVariables =
  | { mode: "create"; payload: BookUpsert }
  | { mode: "update"; bookId: string; payload: PatchedBookUpsert };

export function useUpsertBook() {
  const queryClient = useQueryClient();

  return useMutation<LibraryBook, Error, UpsertBookVariables>({
    mutationFn: async (variables) => {
      if (variables.mode === "create") {
        return createLibraryBook(variables.payload);
      }

      return updateLibraryBook(variables.bookId, variables.payload);
    },
    onSuccess: (book, variables) => {
      queryClient.setQueryData<LibraryBooksResponse | undefined>(
        libraryQueryKeys.books(),
        (current) => {
          const currentBooks = current?.books ?? [];

          if (variables.mode === "create") {
            const exists = currentBooks.some((item) => item.id === book.id);
            const nextBooks = exists
              ? currentBooks.map((item) =>
                  item.id === book.id ? book : item,
                )
              : [...currentBooks, book];

            return { books: nextBooks };
          }

          return {
            books: currentBooks.map((item) =>
              item.id === book.id ? book : item,
            ),
          };
        },
      );

      if (variables.mode === "create") {
        void queryClient.invalidateQueries({
          queryKey: libraryQueryKeys.sections(),
        });
      }
    },
  });
}
