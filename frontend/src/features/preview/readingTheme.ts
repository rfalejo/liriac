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

const serifStack = "ui-serif, Georgia, Cambria, \"Times New Roman\", Times, serif";

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
    alignItems: "stretch",
    overflowY: "auto",
    px: { xs: 2, sm: 4, md: 6 },
    py: { xs: 4, sm: 6, md: 8 },
  },
  blockStack: {
    width: "100%",
    maxWidth: 680,
    bgcolor: "#f5f0e6",
    color: "#1b1b1b",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
    borderRadius: 2,
    px: { xs: 3, sm: 6 },
    py: { xs: 4, sm: 6 },
    display: "flex",
    flexDirection: "column",
    gap: { xs: 3, sm: 4 },
    position: "relative",
    overflow: "hidden",
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
