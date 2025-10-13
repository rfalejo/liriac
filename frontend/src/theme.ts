import { createTheme } from "@mui/material/styles";

const serifStack =
  'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';

const editorTokens = {
  blockPaddingX: { xs: 1.75, sm: 2.5 },
  blockPaddingY: { xs: 1.75, sm: 2.25 },
  blockRadius: 2,
  blockTransition: "background-color 140ms ease, box-shadow 140ms ease",
  blockControlsFade: "opacity 140ms ease",
  iconButtonTransition: "background-color 140ms ease, color 140ms ease",
  paragraphIndent: "1.5em",
} as const;

const baseTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#b88139",
      contrastText: "#fffef9",
    },
    secondary: {
      main: "#4a5568",
    },
    background: {
      default: "#f4efe6",
      paper: "#fdf9f2",
    },
    editor: {
      shellBg: "rgba(249, 243, 232, 0.95)",
      sidebarBg: "rgba(255, 252, 243, 0.92)",
      sidebarBorder: "rgba(111, 85, 47, 0.16)",
      sidebarTextPrimary: "rgba(43, 34, 24, 0.92)",
      sidebarTextMuted: "rgba(43, 34, 24, 0.6)",
      sidebarHeading: "rgba(43, 34, 24, 0.68)",
      sidebarButton: "rgba(43, 34, 24, 0.72)",
      sidebarButtonHover: "rgba(43, 34, 24, 0.9)",
      sidebarSelectedBg: "rgba(184, 129, 57, 0.16)",
      sidebarSelectedText: "rgba(43, 34, 24, 0.92)",
      sidebarHoverBg: "rgba(184, 129, 57, 0.08)",
      sidebarErrorText: "rgba(197, 65, 45, 0.85)",
      blockSurface: "#f8f3e8",
      blockText: "#2a2014",
      blockHeading: "#21170e",
      blockMuted: "rgba(82, 64, 45, 0.72)",
      blockPlaceholderText: "rgba(82, 64, 45, 0.45)",
      blockDisabledText: "rgba(82, 64, 45, 0.5)",
      blockDivider: "rgba(82, 64, 45, 0.2)",
      blockMenuIcon: "rgba(82, 64, 45, 0.64)",
      blockMenuIconHover: "rgba(82, 64, 45, 0.82)",
      blockMenuHoverBg: "rgba(82, 64, 45, 0.08)",
      blockMenuTrigger: "rgba(82, 64, 45, 0.56)",
      blockMenuTriggerHover: "rgba(82, 64, 45, 0.85)",
      blockHoverBg: "rgba(184, 129, 57, 0.08)",
      blockHoverOutline: "rgba(184, 129, 57, 0.18)",
      blockActiveBg: "rgba(184, 129, 57, 0.15)",
      blockActiveOutline: "rgba(184, 129, 57, 0.45)",
      blockIcon: "rgba(82, 64, 45, 0.6)",
      blockIconHover: "rgba(82, 64, 45, 0.78)",
      blockFallbackBorder: "rgba(82, 64, 45, 0.2)",
      scrollTrack: "rgba(234, 223, 204, 1)",
      scrollThumb: "rgba(184, 129, 57, 0.45)",
      scrollThumbHidden: "rgba(184, 129, 57, 0.28)",
      controlConfirmBg: "rgba(76, 175, 80, 0.18)",
      controlConfirmHoverBg: "rgba(76, 175, 80, 0.26)",
      controlConfirmDisabledBg: "rgba(76, 175, 80, 0.12)",
      controlCancelBg: "rgba(197, 65, 45, 0.16)",
      controlCancelHoverBg: "rgba(197, 65, 45, 0.25)",
      controlCancelDisabledBg: "rgba(197, 65, 45, 0.12)",
      controlGhostDisabledText: "rgba(43, 34, 24, 0.5)",
      controlAddColor: "rgba(184, 129, 57, 0.75)",
      controlAddHoverColor: "rgba(184, 129, 57, 0.95)",
      controlAddDisabledColor: "rgba(184, 129, 57, 0.35)",
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    editorBody: {
      fontFamily: serifStack,
      lineHeight: 1.65,
      fontSize: "1.0625rem",
      letterSpacing: "0.003em",
    },
  },
});

const createInteractiveField = (vertical: number, horizontal: number) => ({
  borderRadius: editorTokens.blockRadius,
  padding: baseTheme.spacing(vertical, horizontal),
  backgroundColor: baseTheme.palette.editor.blockActiveBg,
  boxShadow: `inset 0 0 0 1px ${baseTheme.palette.editor.blockHoverOutline}`,
  transition: editorTokens.blockTransition,
  "&:focus": {
    boxShadow: `inset 0 0 0 1px ${baseTheme.palette.editor.blockActiveOutline}`,
  },
});

const editorBlockStyles = {
  divider: {
    borderColor: baseTheme.palette.editor.blockDivider,
  },
  interactiveField: {
    ...createInteractiveField(1, 1.5),
  },
  interactiveFieldDense: {
    ...createInteractiveField(0.75, 1.5),
  },
  interactiveFieldTight: {
    ...createInteractiveField(0.5, 1.25),
  },
  uppercaseLabel: {
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: baseTheme.palette.editor.blockMuted,
  },
} as const;

export const theme = createTheme(baseTheme, {
  editor: {
    ...editorTokens,
    blocks: editorBlockStyles,
  },
  typography: {
    editorParagraph: {
      ...baseTheme.typography.editorBody,
      margin: 0,
      paddingBottom: 0,
      color: baseTheme.palette.editor.blockHeading,
      textIndent: editorTokens.paragraphIndent,
    },
    editorParagraphEditable: {
      ...baseTheme.typography.editorBody,
      margin: 0,
      paddingBottom: 0,
      color: baseTheme.palette.editor.blockHeading,
      textIndent: editorTokens.paragraphIndent,
      outline: "none",
      border: "none",
      whiteSpace: "pre-wrap",
      minHeight: "1.4em",
    },
    editorMuted: {
      ...baseTheme.typography.editorBody,
      color: baseTheme.palette.editor.blockMuted,
    },
    editorDialogueSpeaker: {
      ...baseTheme.typography.editorBody,
      display: "block",
      fontSize: "0.85rem",
      fontWeight: 600,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: baseTheme.palette.editor.blockMuted,
    },
    editorStageDirection: {
      ...baseTheme.typography.editorBody,
      fontStyle: "italic",
      color: baseTheme.palette.editor.blockMuted,
    },
  },
});
