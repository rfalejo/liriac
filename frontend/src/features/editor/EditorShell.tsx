import Box from "@mui/material/Box";
import type { Theme } from "@mui/material/styles";
import type { ComponentProps, ReactNode } from "react";
import { EditorChapterView } from "./EditorChapterView";
import { EditorSidebar } from "./EditorSidebar";
import { HoverableSidePanel } from "./components/HoverableSidePanel";
import type {
  EditorScrollbarHandlers,
  ScrollbarState,
} from "./hooks/useEditorScrollbar";

const shellSx = (theme: Theme) => ({
  minHeight: "100vh",
  position: "relative",
  bgcolor: theme.palette.editor.shellBg,
  backdropFilter: "blur(6px)",
  display: "flex",
  flexDirection: "column",
});

const pageSx = (theme: Theme) => ({
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

const blockStackSx = (theme: Theme) => ({
  width: "100%",
  maxWidth: 640,
  bgcolor: theme.palette.editor.blockSurface,
  color: theme.palette.editor.blockText,
  boxShadow: "0 32px 60px rgba(24, 18, 8, 0.18)",
  borderRadius: 2,
  border: "1px solid rgba(36, 28, 18, 0.1)",
  px: { xs: 2.75, sm: 4.5 },
  py: { xs: 3, sm: 4.5 },
  display: "flex",
  flexDirection: "column",
  gap: { xs: 2.5, sm: 3 },
  position: "relative",
  ...theme.typography.editorBody,
  backgroundImage:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(253, 248, 238, 0.95) 35%, rgba(249, 242, 228, 1) 100%)",
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    pointerEvents: "none",
    backgroundImage:
      "linear-gradient(90deg, rgba(36, 28, 18, 0.08) 0%, rgba(36, 28, 18, 0.02) 20%, rgba(36, 28, 18, 0) 45%, rgba(36, 28, 18, 0) 55%, rgba(36, 28, 18, 0.02) 80%, rgba(36, 28, 18, 0.08) 100%)",
    opacity: 0.45,
  },
});

const contentWrapperSx = (theme: Theme) => ({
  width: "100%",
  maxWidth: 1240,
  display: "flex",
  flexDirection: { xs: "column", lg: "row" },
  alignItems: { xs: "stretch", lg: "flex-start" },
  justifyContent: { xs: "flex-start", lg: "center" },
  gap: { xs: theme.spacing(3), lg: theme.spacing(4.5) },
  py: { xs: 0, lg: 1 },
});

type SidePanelConfig = {
  title: string;
  pinned: boolean;
  visible: boolean;
  onTogglePin: () => void;
  onClose: () => void;
  onEnter: () => void;
  onLeave: () => void;
  width?: number;
  triggerWidth?: number;
};

type EditorShellProps = {
  sidebarProps: ComponentProps<typeof EditorSidebar>;
  leftPanel: SidePanelConfig;
  rightPanel?: SidePanelConfig & { content: ReactNode };
  chapterViewProps: ComponentProps<typeof EditorChapterView>;
  chapterTopSlot?: ReactNode;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  scrollHandlers: EditorScrollbarHandlers;
  scrollbarState: ScrollbarState;
  children?: ReactNode;
};

export function EditorShell({
  sidebarProps,
  leftPanel,
  rightPanel,
  chapterViewProps,
  chapterTopSlot,
  scrollAreaRef,
  scrollHandlers,
  scrollbarState,
  children,
}: EditorShellProps) {
  const leftPinnedOffset = leftPanel.pinned ? leftPanel.width ?? 320 : 0;
  const rightPinnedOffset = rightPanel?.pinned ? rightPanel.width ?? 320 : 0;
  const leftMarginLg = leftPinnedOffset ? `${leftPinnedOffset + 24}px` : undefined;
  const rightMarginLg = rightPinnedOffset
    ? `${rightPinnedOffset + 24}px`
    : undefined;

  return (
    <Box
      component="section"
      aria-labelledby="editor-container-heading"
      sx={shellSx}
    >
      <HoverableSidePanel
        side="left"
        title={leftPanel.title}
        visible={leftPanel.visible}
        pinned={leftPanel.pinned}
        onTogglePin={leftPanel.onTogglePin}
        onClose={leftPanel.onClose}
        onEnter={leftPanel.onEnter}
        onLeave={leftPanel.onLeave}
        width={leftPanel.width}
        triggerWidth={leftPanel.triggerWidth}
      >
        <EditorSidebar {...sidebarProps} />
      </HoverableSidePanel>
      {rightPanel ? (
        <HoverableSidePanel
          side="right"
          title={rightPanel.title}
          visible={rightPanel.visible}
          pinned={rightPanel.pinned}
          onTogglePin={rightPanel.onTogglePin}
          onClose={rightPanel.onClose}
          onEnter={rightPanel.onEnter}
          onLeave={rightPanel.onLeave}
          width={rightPanel.width}
          triggerWidth={rightPanel.triggerWidth}
        >
          {rightPanel.content}
        </HoverableSidePanel>
      ) : null}
      <Box
        ref={scrollAreaRef}
        sx={pageSx}
        data-scrollbar-mode={scrollbarState.mode}
        data-scrollbar-scrollable={scrollbarState.scrollable}
        {...scrollHandlers}
      >
        <Box
          sx={(theme) => {
            const responsiveAdjustments = leftMarginLg || rightMarginLg
              ? {
                  [theme.breakpoints.up("lg")]: {
                    ...(leftMarginLg ? { marginLeft: leftMarginLg } : {}),
                    ...(rightMarginLg ? { marginRight: rightMarginLg } : {}),
                  },
                }
              : {};

            return {
              ...contentWrapperSx(theme),
              ...responsiveAdjustments,
            };
          }}
        >
          <Box sx={blockStackSx}>
            {chapterTopSlot}
            <EditorChapterView {...chapterViewProps} />
          </Box>
        </Box>
      </Box>
      {children}
    </Box>
  );
}
