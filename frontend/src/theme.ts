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
    mode: "dark",
    primary: {
      main: "#58a6ff",
    },
    background: {
      default: "#0d1117",
      paper: "#161b22",
    },
    editor: {
      shellBg: "rgba(6, 8, 10, 0.92)",
      sidebarBg: "rgba(10, 12, 16, 0.68)",
      sidebarBorder: "rgba(255, 255, 255, 0.08)",
      sidebarTextPrimary: "rgba(255, 255, 255, 0.82)",
      sidebarTextMuted: "rgba(255, 255, 255, 0.6)",
      sidebarHeading: "rgba(255, 255, 255, 0.65)",
      sidebarButton: "rgba(255, 255, 255, 0.74)",
      sidebarButtonHover: "rgba(255, 255, 255, 0.92)",
      sidebarSelectedBg: "rgba(255, 255, 255, 0.16)",
      sidebarSelectedText: "rgba(255, 255, 255, 0.95)",
      sidebarHoverBg: "rgba(255, 255, 255, 0.12)",
      sidebarErrorText: "rgba(255, 128, 128, 0.85)",
      blockSurface: "#f5f0e6",
      blockText: "#1b1b1b",
      blockHeading: "#0f1419",
      blockMuted: "#4b4945",
      blockPlaceholderText: "rgba(15, 20, 25, 0.45)",
      blockDisabledText: "rgba(15, 20, 25, 0.5)",
      blockDivider: "rgba(15, 20, 25, 0.24)",
      blockMenuIcon: "rgba(15, 20, 25, 0.64)",
      blockMenuIconHover: "rgba(15, 20, 25, 0.85)",
      blockMenuHoverBg: "rgba(15, 20, 25, 0.08)",
      blockMenuTrigger: "rgba(15, 20, 25, 0.56)",
      blockMenuTriggerHover: "rgba(15, 20, 25, 0.85)",
      blockHoverBg: "rgba(15, 20, 25, 0.04)",
      blockHoverOutline: "rgba(15, 20, 25, 0.12)",
      blockActiveBg: "rgba(25, 118, 210, 0.08)",
      blockActiveOutline: "rgba(25, 118, 210, 0.35)",
      blockIcon: "rgba(15, 20, 25, 0.6)",
      blockIconHover: "rgba(15, 20, 25, 0.78)",
      blockFallbackBorder: "rgba(27, 27, 27, 0.25)",
      scrollTrack: "rgba(20, 24, 32, 1)",
      scrollThumb: "rgba(20, 24, 32, 0.6)",
      scrollThumbHidden: "rgba(20, 24, 32, 0.4)",
      controlConfirmBg: "rgba(76, 175, 80, 0.16)",
      controlConfirmHoverBg: "rgba(76, 175, 80, 0.25)",
      controlConfirmDisabledBg: "rgba(76, 175, 80, 0.12)",
      controlCancelBg: "rgba(244, 67, 54, 0.16)",
      controlCancelHoverBg: "rgba(244, 67, 54, 0.25)",
      controlCancelDisabledBg: "rgba(244, 67, 54, 0.12)",
      controlGhostDisabledText: "rgba(255, 255, 255, 0.6)",
      controlAddColor: "rgba(25, 118, 210, 0.75)",
      controlAddHoverColor: "rgba(25, 118, 210, 0.95)",
      controlAddDisabledColor: "rgba(25, 118, 210, 0.35)",
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

export const theme = createTheme(baseTheme, {
  editor: editorTokens,
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
