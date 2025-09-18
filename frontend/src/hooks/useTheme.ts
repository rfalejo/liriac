import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'liriac:theme:v1';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored =
      typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored === 'light' || stored === 'dark') return stored;
    return 'light';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  const setTheme = (value: Theme) => setThemeState(value);

  return { theme, setTheme } as const;
}
