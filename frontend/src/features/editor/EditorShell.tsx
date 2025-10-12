import { Box } from "@mui/material";
import type { ComponentProps, ReactNode } from "react";
import { EditorChapterView } from "./EditorChapterView";
import { EditorSidebar } from "./EditorSidebar";
import { editorTheme } from "./editorTheme";
import type { EditorScrollbarHandlers } from "./hooks/useEditorScrollbar";

type EditorShellProps = {
  sidebarProps: ComponentProps<typeof EditorSidebar>;
  chapterViewProps: ComponentProps<typeof EditorChapterView>;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  scrollHandlers: EditorScrollbarHandlers;
  scrollbarClassName: string;
  children?: ReactNode;
};

export function EditorShell({
  sidebarProps,
  chapterViewProps,
  scrollAreaRef,
  scrollHandlers,
  scrollbarClassName,
  children,
}: EditorShellProps) {
  return (
    <Box
      component="section"
      aria-labelledby="editor-container-heading"
      sx={editorTheme.shell}
    >
      <EditorSidebar {...sidebarProps} />
      <Box
        ref={scrollAreaRef}
        sx={editorTheme.page}
        className={scrollbarClassName}
        {...scrollHandlers}
      >
        <Box
          sx={{
            ...editorTheme.blockStack,
            fontFamily: editorTheme.typography.fontFamily,
            lineHeight: editorTheme.typography.lineHeight,
            fontSize: editorTheme.typography.fontSize,
            letterSpacing: editorTheme.typography.letterSpacing,
          }}
        >
          <EditorChapterView {...chapterViewProps} />
          {children}
        </Box>
      </Box>
    </Box>
  );
}
