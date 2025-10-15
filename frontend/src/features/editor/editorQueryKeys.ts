export const editorQueryKeys = {
  chapterContextVisibility: (chapterId: string) =>
    ["editor", "chapter-context-visibility", chapterId] as const,
  blockVersions: (chapterId: string, blockId: string) =>
    ["editor", "block-versions", chapterId, blockId] as const,
};
