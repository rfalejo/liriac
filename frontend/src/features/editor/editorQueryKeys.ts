export const editorQueryKeys = {
  chapterContextVisibility: (chapterId: string) =>
    ["editor", "chapter-context-visibility", chapterId] as const,
};
