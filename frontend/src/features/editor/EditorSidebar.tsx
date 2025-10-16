import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { ChapterSummary } from "../../api/library";
import { SidebarChapterList } from "./sidebar/SidebarChapterList";
import { SidebarHeader } from "./sidebar/SidebarHeader";

type EditorSidebarProps = {
  activeChapterId: string | null;
  bookTitle: string | null;
  chapters: ChapterSummary[];
  error: Error | null;
  loading: boolean;
  onSelectChapter: (chapterId: string) => void;
  onReturnToLibrary: () => void;
  hideTitle?: boolean;
};

export function EditorSidebar({
  activeChapterId,
  bookTitle,
  chapters,
  error,
  loading,
  onSelectChapter,
  onReturnToLibrary,
  hideTitle = true,
}: EditorSidebarProps) {
  return (
    <Stack spacing={2.5} sx={{ height: "100%" }}>
      <SidebarHeader
        bookTitle={bookTitle}
        onClose={onReturnToLibrary}
        hideTitle={hideTitle}
      />
      <Box sx={{ flex: 1, overflowY: "auto", pr: 1 }}>
        <SidebarChapterList
          activeChapterId={activeChapterId}
          chapters={chapters}
          error={error}
          loading={loading}
          onSelectChapter={onSelectChapter}
        />
      </Box>
    </Stack>
  );
}
