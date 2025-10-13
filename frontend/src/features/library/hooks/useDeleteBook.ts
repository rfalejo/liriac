import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteLibraryBook,
  type LibraryBooksResponse,
} from "../../../api/library";
import { chapterQueryKeys, libraryQueryKeys } from "../libraryQueryKeys";

type DeleteBookVariables = {
  bookId: string;
};

export function useDeleteBook() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteBookVariables>({
    mutationFn: ({ bookId }) => deleteLibraryBook(bookId),
    onSuccess: (_data, { bookId }) => {
      queryClient.setQueryData<LibraryBooksResponse | undefined>(
        libraryQueryKeys.books(),
        (current) => {
          if (!current) {
            return current;
          }

          const filtered = current.books.filter((book) => book.id !== bookId);
          return { books: filtered };
        },
      );

      void queryClient.invalidateQueries({
        queryKey: libraryQueryKeys.sections(),
      });
      void queryClient.invalidateQueries({
        queryKey: chapterQueryKeys.root,
      });
    },
  });
}
