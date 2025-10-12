import { Box, Fade, Modal } from "@mui/material";
import type { ComponentProps, ReactNode } from "react";
import { PreviewChapterView } from "./PreviewChapterView";
import { PreviewSidebar } from "./PreviewSidebar";
import { readingTheme } from "./readingTheme";
import type { PreviewScrollbarHandlers } from "./usePreviewScrollbar";

type PreviewModalProps = {
  open: boolean;
  onClose: () => void;
  sidebarProps: ComponentProps<typeof PreviewSidebar>;
  chapterViewProps: ComponentProps<typeof PreviewChapterView>;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  scrollHandlers: PreviewScrollbarHandlers;
  scrollbarClassName: string;
  children?: ReactNode;
};

export function PreviewModal({
  open,
  onClose,
  sidebarProps,
  chapterViewProps,
  scrollAreaRef,
  scrollHandlers,
  scrollbarClassName,
  children,
}: PreviewModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      aria-labelledby="preview-container-heading"
    >
      <Fade in={open}>
        <Box sx={readingTheme.shell}>
          <PreviewSidebar {...sidebarProps} />
          <Box
            ref={scrollAreaRef}
            sx={readingTheme.page}
            className={scrollbarClassName}
            {...scrollHandlers}
          >
            <Box
              sx={{
                ...readingTheme.blockStack,
                fontFamily: readingTheme.typography.fontFamily,
                lineHeight: readingTheme.typography.lineHeight,
                fontSize: readingTheme.typography.fontSize,
                letterSpacing: readingTheme.typography.letterSpacing,
              }}
            >
              <PreviewChapterView {...chapterViewProps} />
              {children}
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}
