export const libraryQueryKeys = {
  root: ["library"] as const,
  books: () => [...libraryQueryKeys.root, "books"] as const,
  sections: (bookId: string | null) =>
    [...libraryQueryKeys.root, "sections", bookId ?? "none"] as const,
};

export const chapterQueryKeys = {
  root: ["chapters"] as const,
  detail: (chapterId: string) => [...chapterQueryKeys.root, chapterId] as const,
  detailPlaceholder: () => [...chapterQueryKeys.root, "placeholder"] as const,
};
