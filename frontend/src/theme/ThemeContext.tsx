import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_THEME, THEME_META, type ThemeName } from './themes';

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (_t: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(DEFAULT_THEME);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    // Backward-compatibility if any "dark:" utilities remain elsewhere
    const wantsDark = THEME_META[theme]?.dark ?? false;
    root.classList.toggle('dark', wantsDark);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

export default ThemeProvider;
