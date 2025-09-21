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

export default function CommandBar({
  open,
  value,
  onChange,
  onClose,
  onExecute,
  commands,
}: CommandBarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const filtered = useFilteredCommands(commands, value);

  useEffect(() => {
    if (open) {
      // Delay focusing to ensure mount
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    setActiveIdx(0);
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const pick = filtered[activeIdx];
      if (pick) {
        onChange(pick.label);
      }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const pick = filtered[activeIdx] ?? filtered[0];
      if (pick) {
        onExecute(pick, value);
      } else {
        onClose();
      }
    }
  }

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2">
      <div className="pointer-events-auto overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)]/95 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="select-none text-[var(--muted)]">{'>'}</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command…"
            className="w-full bg-transparent py-1 text-sm text-[var(--fg)] outline-none placeholder:text-[var(--muted)]"
            aria-label="Command input"
          />
          <kbd className="hidden sm:inline rounded border border-[var(--border)] bg-black/20 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
            Esc
          </kbd>
        </div>
        {filtered.length > 0 && (
          <ul className="max-h-64 overflow-auto border-t border-[var(--border)]">
            {filtered.map((cmd, idx) => (
              <li
                key={cmd.id}
                className={[
                  'flex cursor-pointer items-start gap-2 px-3 py-2 text-sm',
                  idx === activeIdx ? 'bg-white/5 text-[var(--fg)]' : 'text-[var(--muted)] hover:text-[var(--fg)] hover:bg-white/5',
                ].join(' ')}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onExecute(cmd, value);
                }}
              >
                <span className="text-[var(--fg)]">{cmd.label}</span>
                {cmd.hint && <span className="ml-auto text-xs italic opacity-70">{cmd.hint}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
