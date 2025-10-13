import Box from "@mui/material/Box";
import type { ChapterSummary } from "../../api/library";
import { SidebarChapterList } from "./sidebar/SidebarChapterList";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { SidebarShell } from "./sidebar/SidebarShell";

type EditorSidebarProps = {
  activeChapterId: string | null;
  bookTitle: string | null;
  chapters: ChapterSummary[];
  error: Error | null;
  loading: boolean;
  onClose: () => void;
  onEnter: () => void;
  onLeave: () => void;
  onSelectChapter: (chapterId: string) => void;
  visible: boolean;
};

export function EditorSidebar({
  activeChapterId,
  bookTitle,
  chapters,
  error,
  loading,
  onClose,
  onEnter,
  onLeave,
  onSelectChapter,
  visible,
}: EditorSidebarProps) {
  return (
    <SidebarShell onEnter={onEnter} onLeave={onLeave} visible={visible}>
      <SidebarHeader bookTitle={bookTitle} onClose={onClose} />
      <Box sx={{ flex: 1, overflowY: "auto", pr: 1 }}>
        <SidebarChapterList
          activeChapterId={activeChapterId}
          chapters={chapters}
          error={error}
          loading={loading}
          onSelectChapter={onSelectChapter}
        />
      </Box>
    </SidebarShell>
  );
}
