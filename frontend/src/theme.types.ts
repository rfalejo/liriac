import type { CSSProperties } from "react";
import type { CSSObject, Theme } from "@mui/material/styles";
import "@mui/material/Typography";
import "@mui/material/styles";

type EditorBlockStyles = Record<string, CSSObject> & {
  divider: CSSObject;
  interactiveField: CSSObject;
  interactiveFieldDense: CSSObject;
  interactiveFieldTight: CSSObject;
  uppercaseLabel: CSSObject;
};

declare module "@mui/material/styles" {
  interface EditorThemeTokens {
    blockPaddingX: { xs: number; sm: number };
    blockPaddingY: { xs: number; sm: number };
    blockRadius: number;
    blockTransition: string;
    blockControlsFade: string;
    iconButtonTransition: string;
    paragraphIndent: string;
    blocks: EditorBlockStyles;
  }

  interface Theme {
    editor: EditorThemeTokens;
  }

  interface ThemeOptions {
    editor?: Partial<EditorThemeTokens>;
  }

  interface EditorPalette {
    shellBg: string;
    sidebarBg: string;
    sidebarBorder: string;
    sidebarTextPrimary: string;
    sidebarTextMuted: string;
    sidebarHeading: string;
    sidebarButton: string;
    sidebarButtonHover: string;
    sidebarSelectedBg: string;
    sidebarSelectedText: string;
    sidebarHoverBg: string;
    sidebarErrorText: string;
    blockSurface: string;
    blockText: string;
    blockHeading: string;
    blockMuted: string;
    blockPlaceholderText: string;
    blockDisabledText: string;
    blockDivider: string;
    blockMenuIcon: string;
    blockMenuIconHover: string;
    blockMenuHoverBg: string;
    blockMenuTrigger: string;
    blockMenuTriggerHover: string;
    blockHoverBg: string;
    blockHoverOutline: string;
    blockActiveBg: string;
    blockActiveOutline: string;
    blockIcon: string;
    blockIconHover: string;
    blockFallbackBorder: string;
    scrollTrack: string;
    scrollThumb: string;
    scrollThumbHidden: string;
    controlConfirmBg: string;
    controlConfirmHoverBg: string;
    controlConfirmDisabledBg: string;
    controlCancelBg: string;
    controlCancelHoverBg: string;
    controlCancelDisabledBg: string;
    controlGhostDisabledText: string;
    controlAddColor: string;
    controlAddHoverColor: string;
    controlAddDisabledColor: string;
  }

  interface Palette {
    editor: EditorPalette;
  }

  interface PaletteOptions {
    editor?: Partial<EditorPalette>;
  }

  interface TypographyVariants {
    editorBody: CSSProperties;
    editorParagraph: CSSProperties;
    editorParagraphEditable: CSSProperties;
    editorMuted: CSSProperties;
    editorDialogueSpeaker: CSSProperties;
    editorStageDirection: CSSProperties;
  }

  interface TypographyVariantsOptions {
    editorBody?: CSSProperties;
    editorParagraph?: CSSProperties;
    editorParagraphEditable?: CSSProperties;
    editorMuted?: CSSProperties;
    editorDialogueSpeaker?: CSSProperties;
    editorStageDirection?: CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    editorBody: true;
    editorParagraph: true;
    editorParagraphEditable: true;
    editorMuted: true;
    editorDialogueSpeaker: true;
    editorStageDirection: true;
  }
}

export {};
