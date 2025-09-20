import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useTopBarState } from './context';

export default function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const { breadcrumb, quickActions = [], chips = [], meta, connectivity, api } = useTopBarState();

  return (
    <header role="banner" className="border-b border-zinc-200/70 bg-zinc-100/70 backdrop-blur dark:bg-zinc-900/70 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Left: brand + breadcrumb */}
        <div className="min-w-0 flex items-center gap-4 flex-1">
          <h1 className="text-xl font-bold tracking-tight shrink-0">
            <Link
              to="/"
              aria-label="Liriac home"
              className="transition-colors text-zinc-900 hover:text-indigo-500 dark:text-zinc-100 dark:hover:text-indigo-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              liriac
            </Link>
          </h1>
          <nav aria-label="Breadcrumb" className="truncate text-sm text-zinc-700 dark:text-zinc-300">
            {breadcrumb || ' '} 
          </nav>
        </div>

        {/* Center: search / palette */}
        <div role="search" className="hidden sm:flex items-center max-w-sm w-full">
          <button
            type="button"
            aria-label="Open command palette"
            onClick={() => api.openPalette()}
            className="w-full text-left px-3 py-1.5 rounded-md border border-zinc-300/70 bg-white/70 text-sm text-zinc-600 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-400 dark:hover:bg-zinc-800"
            title="Cmd/Ctrl+K"
          >
            Search or jump…
          </button>
        </div>

        {/* Right: actions, chips, meta, connectivity, theme, help */}
        <div className="flex items-center gap-2">
          {(quickActions || []).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={a.onClick}
              disabled={a.disabled}
              aria-label={a.ariaLabel || a.label}
              className="px-2 py-1 rounded border border-zinc-300/70 text-xs hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {a.label}
            </button>
          ))}

          {(chips || []).map((c) => (
            <span
              key={c.id}
              aria-label={c.ariaLabel || c.label}
              title={c.label}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-300/70 bg-white/70 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300"
            >
              {c.label}
              {typeof c.count === 'number' ? (
                <span className="font-mono text-[10px] px-1 rounded bg-zinc-200/80 dark:bg-zinc-800/80">{c.count}</span>
              ) : null}
            </span>
          ))}

          {meta && (meta.words || meta.readingMinutes) ? (
            <span className="ml-1 text-xs text-zinc-600 dark:text-zinc-400">
              {meta.words ? `${meta.words.toLocaleString()} words` : ''}
              {meta.words && meta.readingMinutes ? ' • ' : ''}
              {meta.readingMinutes ? `${meta.readingMinutes} min` : ''}
            </span>
          ) : null}

          {connectivity ? (
            <div className="ml-1 flex items-center gap-1 text-[10px] uppercase font-mono">
              {connectivity.env ? (
                <span className="px-1.5 py-0.5 rounded border border-zinc-300/70 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                  {connectivity.env}
                </span>
              ) : null}
              <span className="px-1.5 py-0.5 rounded border border-zinc-300/70 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300" title={`API: ${connectivity.api}`}>
                API: {connectivity.api}
              </span>
              <span className="px-1.5 py-0.5 rounded border border-zinc-300/70 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300" title={`WS: ${connectivity.ws}`}>
                WS: {connectivity.ws}
              </span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={isDark}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="ml-1 inline-flex items-center gap-1 rounded border border-zinc-300/70 px-2 py-1 text-xs font-medium tracking-wide uppercase text-zinc-700 shadow-sm transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 hover:bg-zinc-200/70 active:bg-zinc-300/70 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/80 dark:active:bg-zinc-700/80"
            title="T"
          >
            <span className="font-mono">{isDark ? 'dark' : 'light'}</span>
            <span aria-hidden="true" className="text-lg leading-none">|</span>
          </button>

          <button
            type="button"
            aria-label="Help and shortcuts"
            title="?"
            className="inline-flex items-center rounded border border-zinc-300/70 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            onClick={() => api.openPalette()}
          >
            ?
          </button>
        </div>
      </div>
    </header>
  );
}
