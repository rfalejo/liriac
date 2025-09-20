import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';

export function AppLayout({ children }: PropsWithChildren) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col">
      <header className="border-b border-zinc-200/70 bg-zinc-100/70 backdrop-blur dark:bg-zinc-900/70 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            <Link
              to="/"
              aria-label="Liriac home"
              className="transition-colors text-zinc-900 hover:text-indigo-500 dark:text-zinc-100 dark:hover:text-indigo-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              liriac
            </Link>
          </h1>
          <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <nav
              aria-label="Main navigation"
              className="hidden sm:flex items-center gap-4 opacity-70"
            >
              <span>draft · tty</span>
            </nav>
            <button
              type="button"
              onClick={toggleTheme}
              aria-pressed={isDark}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex items-center gap-2 rounded border border-zinc-300/70 px-3 py-1.5 text-xs font-medium tracking-wide uppercase text-zinc-700 shadow-sm transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 hover:bg-zinc-200/70 active:bg-zinc-300/70 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/80 dark:active:bg-zinc-700/80"
            >
              <span className="font-mono">{isDark ? 'dark' : 'light'}</span>
              <span aria-hidden="true" className="text-lg leading-none">
                |
              </span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl w-full mx-auto px-4 py-8 flex-1 flex flex-col gap-6">
        {children}
      </main>
    </div>
  );
}

export default AppLayout;
