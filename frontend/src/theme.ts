import { createTheme } from "@mui/material/styles";

const sansStack =
  '"Work Sans", "Inter", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
const serifStack =
  '"Literata", "Merriweather", Georgia, Cambria, "Times New Roman", Times, serif';

const editorTokens = {
  blockPaddingX: { xs: 1.6, sm: 2.25 },
  blockPaddingY: { xs: 1.35, sm: 1.8 },
  blockRadius: 2,
  blockTransition:
    "background-color 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
  blockControlsFade: "opacity 140ms ease",
  iconButtonTransition: "background-color 140ms ease, color 140ms ease",
  paragraphIndent: "1.5em",
} as const;

const baseTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#a47133",
      contrastText: "#fffaf0",
    },
    secondary: {
      main: "#5a5146",
    },
    background: {
      default: "#f7f3ea",
      paper: "#f9f2e4",
    },
    text: {
      primary: "#2f281d",
      secondary: "rgba(47, 40, 29, 0.68)",
    },
    divider: "rgba(47, 40, 29, 0.1)",
    editor: {
      shellBg: "rgba(247, 243, 234, 0.96)",
      sidebarBg: "rgba(251, 248, 241, 0.94)",
      sidebarBorder: "rgba(47, 40, 29, 0.08)",
      sidebarTextPrimary: "rgba(47, 40, 29, 0.88)",
      sidebarTextMuted: "rgba(47, 40, 29, 0.58)",
      sidebarHeading: "rgba(47, 40, 29, 0.64)",
      sidebarButton: "rgba(47, 40, 29, 0.7)",
      sidebarButtonHover: "rgba(47, 40, 29, 0.88)",
      sidebarSelectedBg: "rgba(164, 113, 51, 0.12)",
      sidebarSelectedText: "rgba(47, 40, 29, 0.92)",
      sidebarHoverBg: "rgba(164, 113, 51, 0.08)",
      sidebarErrorText: "rgba(191, 74, 52, 0.82)",
  blockSurface: "#fdf8ee",
  blockText: "#241c12",
  blockHeading: "#21170c",
  blockMuted: "rgba(36, 28, 18, 0.62)",
  blockPlaceholderText: "rgba(36, 28, 18, 0.4)",
  blockDisabledText: "rgba(36, 28, 18, 0.46)",
  blockDivider: "rgba(36, 28, 18, 0.16)",
      blockMenuIcon: "rgba(47, 40, 29, 0.6)",
      blockMenuIconHover: "rgba(47, 40, 29, 0.8)",
      blockMenuHoverBg: "rgba(164, 113, 51, 0.08)",
      blockMenuTrigger: "rgba(47, 40, 29, 0.58)",
      blockMenuTriggerHover: "rgba(47, 40, 29, 0.88)",
      blockHoverBg: "rgba(164, 113, 51, 0.08)",
      blockHoverOutline: "rgba(164, 113, 51, 0.16)",
      blockActiveBg: "rgba(164, 113, 51, 0.12)",
      blockActiveOutline: "rgba(164, 113, 51, 0.4)",
      blockIcon: "rgba(47, 40, 29, 0.62)",
      blockIconHover: "rgba(47, 40, 29, 0.8)",
      blockFallbackBorder: "rgba(47, 40, 29, 0.16)",
      scrollTrack: "rgba(232, 223, 208, 1)",
      scrollThumb: "rgba(164, 113, 51, 0.4)",
      scrollThumbHidden: "rgba(164, 113, 51, 0.26)",
      controlConfirmBg: "rgba(104, 153, 68, 0.16)",
      controlConfirmHoverBg: "rgba(104, 153, 68, 0.24)",
      controlConfirmDisabledBg: "rgba(104, 153, 68, 0.12)",
      controlCancelBg: "rgba(191, 74, 52, 0.16)",
      controlCancelHoverBg: "rgba(191, 74, 52, 0.25)",
      controlCancelDisabledBg: "rgba(191, 74, 52, 0.12)",
      controlDeleteBg: "rgba(191, 74, 52, 0.3)",
      controlDeleteHoverBg: "rgba(191, 74, 52, 0.42)",
      controlDeleteDisabledBg: "rgba(191, 74, 52, 0.18)",
      controlGhostDisabledText: "rgba(47, 40, 29, 0.5)",
      controlAddColor: "rgba(164, 113, 51, 0.72)",
      controlAddHoverColor: "rgba(164, 113, 51, 0.92)",
      controlAddDisabledColor: "rgba(164, 113, 51, 0.32)",
      controlSuggestBg: "rgba(58, 122, 192, 0.22)",
      controlSuggestHoverBg: "rgba(58, 122, 192, 0.3)",
      controlSuggestDisabledBg: "rgba(58, 122, 192, 0.12)",
      suggestionPromptBg: "rgba(58, 122, 192, 0.08)",
      suggestionPromptBorder: "rgba(58, 122, 192, 0.24)",
      suggestionPromptShadow: "0 8px 20px rgba(58, 122, 192, 0.12)",
      suggestionHighlightBg: "rgba(58, 122, 192, 0.12)",
      suggestionHighlightBorder: "rgba(58, 122, 192, 0.2)",
      suggestionHighlightText: "rgba(36, 65, 98, 1)",
      suggestionErrorText: "rgba(191, 74, 52, 0.86)",
    },
    },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: sansStack,
    h1: {
      fontFamily: serifStack,
      fontWeight: 600,
      letterSpacing: "-0.015em",
      color: "#2f281d",
    },
    h2: {
      fontFamily: serifStack,
      fontWeight: 600,
      letterSpacing: "-0.012em",
      color: "#2f281d",
    },
    h3: {
      fontFamily: serifStack,
      fontWeight: 600,
      letterSpacing: "-0.01em",
      color: "#2f281d",
    },
    h4: {
      fontFamily: serifStack,
      fontWeight: 600,
      letterSpacing: "-0.008em",
      color: "#2f281d",
    },
    h5: {
      fontFamily: serifStack,
      fontWeight: 600,
      letterSpacing: "-0.006em",
      color: "#2f281d",
    },
    h6: {
      fontFamily: serifStack,
      fontWeight: 600,
      letterSpacing: "-0.004em",
      color: "#2f281d",
    },
    subtitle1: {
      fontWeight: 600,
      letterSpacing: "0.01em",
    },
    subtitle2: {
      fontWeight: 600,
      letterSpacing: "0.02em",
    },
    button: {
      fontWeight: 600,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
    },
    overline: {
      fontWeight: 600,
      letterSpacing: "0.22em",
      textTransform: "uppercase",
    },
    editorBody: {
      fontFamily: serifStack,
      lineHeight: 1.6,
      fontSize: "1.04rem",
      letterSpacing: "0.004em",
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
      textAlign: "justify",
      hyphens: "auto",
      lineHeight: 1.6,
    },
    editorParagraphEditable: {
      ...baseTheme.typography.editorBody,
      margin: 0,
      paddingBottom: 0,
      color: baseTheme.palette.editor.blockHeading,
      textIndent: editorTokens.paragraphIndent,
      textAlign: "left",
      hyphens: "auto",
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
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      fontVariant: "small-caps",
      color: baseTheme.palette.editor.blockMuted,
    },
    editorStageDirection: {
      ...baseTheme.typography.editorBody,
      fontStyle: "italic",
      color: baseTheme.palette.editor.blockMuted,
    },
  },
});
