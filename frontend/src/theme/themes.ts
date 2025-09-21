export type ThemeName = 'gotham' | 'zen';

export const DEFAULT_THEME: ThemeName = 'zen';

export const THEME_META: Record<ThemeName, { dark: boolean }> = {
  gotham: { dark: true },
  zen: { dark: true },
};
