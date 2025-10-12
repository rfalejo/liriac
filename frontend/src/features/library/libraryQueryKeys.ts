export const libraryQueryKeys = {
  root: ["library"] as const,
  books: () => [...libraryQueryKeys.root, "books"] as const,
  sections: () => [...libraryQueryKeys.root, "sections"] as const,
};

export const chapterQueryKeys = {
  root: ["chapters"] as const,
  detail: (chapterId: string) => [...chapterQueryKeys.root, chapterId] as const,
  detailPlaceholder: () => [...chapterQueryKeys.root, "placeholder"] as const,
};
