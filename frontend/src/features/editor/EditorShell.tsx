import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ComponentProps, ReactNode } from "react";
import { EditorChapterView } from "./EditorChapterView";
import { EditorSidebar } from "./EditorSidebar";
import type {
  EditorScrollbarHandlers,
  ScrollbarState,
} from "./hooks/useEditorScrollbar";

const shellSx: SxProps<Theme> = (theme) => ({
  minHeight: "100vh",
  position: "relative",
  bgcolor: theme.palette.editor.shellBg,
  backdropFilter: "blur(6px)",
  display: "flex",
  flexDirection: "column",
});

const pageSx: SxProps<Theme> = (theme) => ({
  flex: 1,
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  overflowY: "auto",
  px: { xs: 2, sm: 4, md: 6 },
  py: { xs: 4, sm: 6, md: 8 },
  scrollbarWidth: "thin",
  scrollbarColor: `${theme.palette.editor.scrollThumb} transparent`,
  transition: "scrollbar-color 320ms ease",
  '&[data-scrollbar-mode="hidden"]': {
    scrollbarColor: "transparent transparent",
  },
  '&[data-scrollbar-scrollable="false"]': {
    scrollbarColor: "transparent transparent",
  },
  "&::-webkit-scrollbar": {
    width: 12,
    height: 12,
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "transparent",
    margin: 12,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.editor.scrollThumb,
    borderRadius: 999,
    border: "3px solid transparent",
    backgroundClip: "content-box",
    transition: "opacity 320ms ease, background-color 320ms ease",
    opacity: 1,
  },
  '&[data-scrollbar-mode="hidden"]::-webkit-scrollbar-thumb': {
    opacity: 0,
    backgroundColor: theme.palette.editor.scrollThumbHidden,
  },
  '&[data-scrollbar-scrollable="false"]::-webkit-scrollbar': {
    display: "none",
  },
});

const blockStackSx: SxProps<Theme> = (theme) => ({
  width: "100%",
  maxWidth: 760,
  bgcolor: theme.palette.editor.blockSurface,
  color: theme.palette.editor.blockText,
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
  borderRadius: 2,
  px: { xs: 3, sm: 6 },
  py: { xs: 3.5, sm: 5 },
  display: "flex",
  flexDirection: "column",
  gap: { xs: 2.5, sm: 3 },
  position: "relative",
  ...theme.typography.editorBody,
});

const contentWrapperSx: SxProps<Theme> = (theme) => ({
  width: "100%",
  maxWidth: 1240,
  display: "flex",
  flexDirection: { xs: "column", lg: "row" },
  alignItems: { xs: "stretch", lg: "flex-start" },
  gap: { xs: theme.spacing(3), lg: theme.spacing(4.5) },
  py: { xs: 0, lg: 1 },
});

const rightPanelSx: SxProps<Theme> = (theme) => ({
  flex: { xs: "1 1 100%", lg: "0 0 320px" },
  maxWidth: { xs: "100%", lg: 360 },
  width: "100%",
  position: { xs: "static", lg: "sticky" },
  top: { lg: theme.spacing(6) },
});

type EditorShellProps = {
  sidebarProps: ComponentProps<typeof EditorSidebar>;
  chapterViewProps: ComponentProps<typeof EditorChapterView>;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  scrollHandlers: EditorScrollbarHandlers;
  scrollbarState: ScrollbarState;
  children?: ReactNode;
  rightPanel?: ReactNode;
};

export function EditorShell({
  sidebarProps,
  chapterViewProps,
  scrollAreaRef,
  scrollHandlers,
  scrollbarState,
  children,
  rightPanel,
}: EditorShellProps) {
  return (
    <Box
      component="section"
      aria-labelledby="editor-container-heading"
      sx={shellSx}
    >
      <EditorSidebar {...sidebarProps} />
      <Box
        ref={scrollAreaRef}
        sx={pageSx}
        data-scrollbar-mode={scrollbarState.mode}
        data-scrollbar-scrollable={scrollbarState.scrollable}
        {...scrollHandlers}
      >
        <Box sx={contentWrapperSx}>
          <Box sx={blockStackSx}>
            <EditorChapterView {...chapterViewProps} />
          </Box>
          {rightPanel ? <Box sx={rightPanelSx}>{rightPanel}</Box> : null}
        </Box>
      </Box>
      {children}
    </Box>
  );
}
