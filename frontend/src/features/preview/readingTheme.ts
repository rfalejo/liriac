import { SxProps, Theme } from "@mui/material/styles";

export type ReadingTheme = {
  shell: SxProps<Theme>;
  page: SxProps<Theme>;
  blockStack: SxProps<Theme>;
  typography: {
    fontFamily: string;
    lineHeight: number;
    fontSize: string;
    letterSpacing: string;
  };
};

const serifStack =
  'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';

export const readingTheme: ReadingTheme = {
  shell: {
    position: "fixed",
    inset: 0,
    bgcolor: "rgba(6, 8, 10, 0.92)",
    backdropFilter: "blur(6px)",
    display: "flex",
    flexDirection: "column",
  },
  page: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    overflowY: "auto",
    px: { xs: 2, sm: 4, md: 6 },
    py: { xs: 4, sm: 6, md: 8 },
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(20, 24, 32, 1) transparent",
    transition: "scrollbar-color 320ms ease",
    "&.preview-scroll-area.scrollbar-hidden": {
      scrollbarColor: "transparent transparent",
    },
    "&.preview-scroll-area.scrollbar-disabled": {
      scrollbarColor: "transparent transparent",
    },
    "&.preview-scroll-area::-webkit-scrollbar": {
      width: 12,
      height: 12,
    },
    "&.preview-scroll-area::-webkit-scrollbar-track": {
      backgroundColor: "transparent",
      margin: 12,
    },
    "&.preview-scroll-area::-webkit-scrollbar-thumb": {
      backgroundColor: "rgba(20, 24, 32, 0.6)",
      borderRadius: 999,
      border: "3px solid transparent",
      backgroundClip: "content-box",
      transition: "opacity 320ms ease, background-color 320ms ease",
      opacity: 1,
    },
    "&.preview-scroll-area.scrollbar-hidden::-webkit-scrollbar-thumb": {
      opacity: 0,
      backgroundColor: "rgba(20, 24, 32, 0.4)",
    },
    "&.preview-scroll-area.scrollbar-disabled::-webkit-scrollbar": {
      display: "none",
    },
  },
  blockStack: {
    width: "100%",
    maxWidth: 760,
    bgcolor: "#f5f0e6",
    color: "#1b1b1b",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
    borderRadius: 2,
    px: { xs: 3, sm: 6 },
    py: { xs: 3.5, sm: 5 },
    display: "flex",
    flexDirection: "column",
    gap: { xs: 2.5, sm: 3 },
    position: "relative",
  },
  typography: {
    fontFamily: serifStack,
    lineHeight: 1.65,
    fontSize: "1.0625rem",
    letterSpacing: "0.003em",
  },
};

export const readingThemeConstants = {
  headingColor: "#0f1419",
  mutedColor: "#4b4945",
};
