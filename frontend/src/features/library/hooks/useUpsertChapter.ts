import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createLibraryChapter,
  type ChapterSummary,
  type ChapterUpsert,
  type PatchedChapterUpsert,
  updateLibraryChapter,
} from "../../../api/library";
import { chapterQueryKeys, libraryQueryKeys } from "../libraryQueryKeys";
import type { LibraryBooksResponse } from "../../../api/library";

export type UpsertChapterVariables =
  | { mode: "create"; bookId: string; payload: ChapterUpsert }
  | {
      mode: "update";
      bookId: string;
      chapterId: string;
      payload: PatchedChapterUpsert;
    };

export function useUpsertChapter() {
  const queryClient = useQueryClient();

  return useMutation<ChapterSummary, Error, UpsertChapterVariables>({
    mutationFn: async (variables) => {
      if (variables.mode === "create") {
        return createLibraryChapter(variables.bookId, variables.payload);
      }

      return updateLibraryChapter(variables.chapterId, variables.payload);
    },
    onSuccess: (chapter, variables) => {
      queryClient.setQueryData<LibraryBooksResponse | undefined>(
        libraryQueryKeys.books(),
        (current) => {
          if (!current) {
            return current;
          }

          return {
            books: current.books.map((book) => {
              if (book.id !== variables.bookId) {
                return book;
              }

              const existingChapters = book.chapters ?? [];
              let nextChapters: ChapterSummary[];

              if (variables.mode === "create") {
                const alreadyPresent = existingChapters.some(
                  (item) => item.id === chapter.id,
                );
                nextChapters = alreadyPresent
                  ? existingChapters.map((item) =>
                      item.id === chapter.id ? chapter : item,
                    )
                  : [...existingChapters, chapter];
              } else {
                nextChapters = existingChapters.map((item) =>
                  item.id === chapter.id ? chapter : item,
                );
              }

              nextChapters.sort((a, b) => a.ordinal - b.ordinal);

              return {
                ...book,
                chapters: nextChapters,
              };
            }),
          };
        },
      );

      void queryClient.invalidateQueries({
        queryKey: chapterQueryKeys.detail(chapter.id),
      });
    },
  });
}
