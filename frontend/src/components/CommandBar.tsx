import { useEffect, useMemo, useRef, useState } from 'react';

export type Command = {
  id: string;
  label: string;
  hint?: string;
  aliases?: string[];
};

export type CommandBarProps = {
  open: boolean;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onExecute: (cmd: Command, input: string) => void;
  commands: Command[];
};

function useFilteredCommands(commands: Command[], query: string) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands.slice(0, 6);
    const parts = q.split(/\s+/g);
    return commands
      .map((c) => {
        const hay = [c.label, ...(c.aliases ?? [])].join(' ').toLowerCase();
        const score = parts.reduce((acc, p) => (hay.includes(p) ? acc + 1 : acc), 0);
        return { c, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ c }) => c)
      .slice(0, 8);
  }, [commands, query]);
}

function normalizeCmd(s: string) {
  return s.replace(/^\//, '');
}

function computeSuggestion(commands: Command[], value: string): string | null {
  if (!value.trim().startsWith('/')) return null;
  const q = normalizeCmd(value.trim()).toLowerCase();
  if (!q) return null;
  for (const c of commands) {
    const label = c.label.toLowerCase();
    if (label.startsWith(q)) return c.label;
    for (const a of c.aliases ?? []) {
      const an = normalizeCmd(a).toLowerCase();
      if (an.startsWith(q)) return c.label;
    }
  }
  return null;
}

function findCommand(commands: Command[], input: string): Command | undefined {
  const q = normalizeCmd(input.trim()).toLowerCase();
  return commands.find(
    (c) =>
      c.label.toLowerCase() === q ||
      (c.aliases ?? []).some((a) => normalizeCmd(a).toLowerCase() === q),
  );
}

export default function CommandBar({
  open,
  value,
  onChange,
  onClose,
  onExecute,
  commands,
}: CommandBarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState<number | null>(null);
  const HIST_KEY = 'liriac:cmdHistory';
  const suggestion = computeSuggestion(commands, value);
  const completionTail =
    suggestion && value.trim().startsWith('/')
      ? suggestion.slice(normalizeCmd(value.trim()).length)
      : '';

  // Load history once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HIST_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setHistory(arr.filter((s) => typeof s === 'string'));
      }
    } catch {}
  }, []);

  // Reset history cursor whenever the bar opens
  useEffect(() => {
    if (open) setHistIdx(null);
  }, [open]);

  useEffect(() => {
    if (open) {
      // Delay focusing to ensure mount
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    // no-op: active suggestion handled by inline autocomplete
  }, [value]);

  function addToHistory(entry: string) {
    const clean = entry.trim();
    if (!clean) return;
    setHistory((h) => {
      const next = [clean, ...h.filter((x) => x !== clean)].slice(0, 50);
      try {
        localStorage.setItem(HIST_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    // If input is empty, use Up/Down to navigate history
    const isEmpty = value.trim().length === 0;

    if (e.key === 'ArrowUp') {
      if (isEmpty && history.length > 0) {
        e.preventDefault();
        const nextIdx = histIdx === null ? 0 : Math.min(histIdx + 1, history.length - 1);
        setHistIdx(nextIdx);
        onChange(history[nextIdx]);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      if (histIdx !== null) {
        e.preventDefault();
        if (histIdx <= 0) {
          setHistIdx(null);
          onChange('');
        } else {
          const nextIdx = histIdx - 1;
          setHistIdx(nextIdx);
          onChange(history[nextIdx]);
        }
        return;
      }
    }

    // Accept autocomplete with Tab, or ArrowRight at end
    if (
      (e.key === 'Tab' || e.key === 'ArrowRight') &&
      suggestion &&
      completionTail &&
      (e.currentTarget.selectionStart ?? 0) === value.length
    ) {
      e.preventDefault();
      onChange('/' + suggestion);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const chosen =
        findCommand(commands, value) ??
        (suggestion ? commands.find((c) => c.label === suggestion) : undefined);

      if (chosen) {
        const entry = (value || '/' + chosen.label).trim();
        if (entry) addToHistory(entry);
        onExecute(chosen, value);
      } else {
        onClose();
      }
      return;
    }
  }

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2">
      <div className="pointer-events-auto overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)]/95 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="select-none text-[var(--muted)]">{'>'}</span>
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => {
                if (histIdx !== null) setHistIdx(null);
                onChange(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a command…"
              className="w-full bg-transparent py-1 text-sm text-[var(--fg)] outline-none placeholder:text-[var(--muted)]"
              aria-label="Command input"
            />
            {completionTail && (
              <div className="pointer-events-none absolute inset-0 flex items-center">
                <span className="invisible">{value}</span>
                <span className="text-[var(--muted)] opacity-50">{completionTail}</span>
              </div>
            )}
          </div>
          <span
            className={`hidden sm:inline text-[10px] text-[var(--muted)] ml-2 ${completionTail ? 'opacity-60' : 'opacity-0'}`}
          >
            Tab to autocomplete
          </span>
          <kbd className="hidden sm:inline rounded border border-[var(--border)] bg-black/20 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
            Esc
          </kbd>
        </div>
      </div>
    </div>
  );
}
