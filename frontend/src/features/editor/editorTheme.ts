import { SxProps, Theme } from "@mui/material/styles";

export type EditorTheme = {
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

export type EditorBlockTheme = {
  colors: {
    headingColor: string;
    mutedColor: string;
  };
  controls: {
    confirmButton: SxProps<Theme>;
    cancelButton: SxProps<Theme>;
    addButton: SxProps<Theme>;
  };
  inputs: {
    field: SxProps<Theme>;
    multiline: SxProps<Theme>;
  };
};

const serifStack =
  'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';

const baseBodyTypography = {
  fontFamily: serifStack,
  lineHeight: 1.65,
  fontSize: "1.0625rem",
  letterSpacing: "0.003em",
};

export const editorTheme: EditorTheme = {
  shell: {
    minHeight: "100vh",
    position: "relative",
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
    "&.editor-scroll-area.scrollbar-hidden": {
      scrollbarColor: "transparent transparent",
    },
    "&.editor-scroll-area.scrollbar-disabled": {
      scrollbarColor: "transparent transparent",
    },
    "&.editor-scroll-area::-webkit-scrollbar": {
      width: 12,
      height: 12,
    },
    "&.editor-scroll-area::-webkit-scrollbar-track": {
      backgroundColor: "transparent",
      margin: 12,
    },
    "&.editor-scroll-area::-webkit-scrollbar-thumb": {
      backgroundColor: "rgba(20, 24, 32, 0.6)",
      borderRadius: 999,
      border: "3px solid transparent",
      backgroundClip: "content-box",
      transition: "opacity 320ms ease, background-color 320ms ease",
      opacity: 1,
    },
    "&.editor-scroll-area.scrollbar-hidden::-webkit-scrollbar-thumb": {
      opacity: 0,
      backgroundColor: "rgba(20, 24, 32, 0.4)",
    },
    "&.editor-scroll-area.scrollbar-disabled::-webkit-scrollbar": {
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
    ...baseBodyTypography,
  },
  typography: {
    ...baseBodyTypography,
  },
};

const textFieldBaseSx: SxProps<Theme> = {
  "& .MuiInputLabel-root": {
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "rgba(15, 20, 25, 0.58)",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "rgba(25, 118, 210, 0.9)",
  },
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    backgroundColor: "rgba(15, 20, 25, 0.035)",
    transition:
      "background-color 160ms ease, box-shadow 160ms ease, color 160ms ease",
  },
  "& .MuiOutlinedInput-root:hover:not(.Mui-disabled)": {
    backgroundColor: "rgba(15, 20, 25, 0.06)",
  },
  "& .MuiOutlinedInput-root.Mui-focused": {
    backgroundColor: "rgba(25, 118, 210, 0.08)",
    boxShadow: "0 0 0 1px rgba(25, 118, 210, 0.35)",
  },
  "& .MuiOutlinedInput-root.Mui-disabled": {
    backgroundColor: "rgba(15, 20, 25, 0.08)",
    color: "rgba(15, 20, 25, 0.5)",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
  },
  "& .MuiOutlinedInput-input": {
    fontSize: "0.95rem",
    paddingTop: "14px",
    paddingBottom: "14px",
    color: "#1b1b1b",
    fontFamily: serifStack,
  },
  "& .MuiOutlinedInput-input::placeholder": {
    color: "rgba(15, 20, 25, 0.45)",
    opacity: 1,
  },
  "& textarea": {
    color: "#1b1b1b",
    fontFamily: serifStack,
  },
  "& .MuiFormHelperText-root": {
    color: "rgba(15, 20, 25, 0.6)",
  },
};

const multilineTextFieldSx: SxProps<Theme> = [
  textFieldBaseSx,
  {
    "& .MuiOutlinedInput-root": {
      alignItems: "flex-start",
      paddingTop: 0,
      paddingBottom: 0,
    },
    "& .MuiOutlinedInput-input": {
      minHeight: "4.25rem",
      paddingTop: "12px",
      paddingBottom: "12px",
    },
    "& .MuiOutlinedInput-input.MuiInputBase-inputMultiline": {
      padding: 0,
    },
  },
];

export const editorBlockTheme: EditorBlockTheme = {
  colors: {
    headingColor: "#0f1419",
    mutedColor: "#4b4945",
  },
  controls: {
    confirmButton: {
      backgroundColor: "rgba(76, 175, 80, 0.16)",
      "&:hover": {
        backgroundColor: "rgba(76, 175, 80, 0.25)",
      },
      "&.Mui-disabled": {
        backgroundColor: "rgba(76, 175, 80, 0.12)",
        color: "rgba(255, 255, 255, 0.6)",
      },
    },
    cancelButton: {
      backgroundColor: "rgba(244, 67, 54, 0.16)",
      "&:hover": {
        backgroundColor: "rgba(244, 67, 54, 0.25)",
      },
      "&.Mui-disabled": {
        backgroundColor: "rgba(244, 67, 54, 0.12)",
        color: "rgba(255, 255, 255, 0.6)",
      },
    },
    addButton: {
      alignSelf: "flex-start",
      color: "rgba(25, 118, 210, 0.75)",
      "&:hover": {
        color: "rgba(25, 118, 210, 0.95)",
      },
      "&.Mui-disabled": {
        color: "rgba(25, 118, 210, 0.35)",
      },
    },
  },
  inputs: {
    field: textFieldBaseSx,
    multiline: multilineTextFieldSx,
  },
};

export const editorThemeConstants = editorBlockTheme.colors;

export const editorBodyTypographySx = {
  ...baseBodyTypography,
};

export const editorFontFamily = baseBodyTypography.fontFamily;
