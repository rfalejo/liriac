import { useEffect, useRef, useState } from 'react';
import {
  computeSuggestion,
  findCommand,
  normalizeCmd,
  type CommandLike,
} from '../commands/commandUtils';

export type UseCommandPaletteArgs = {
  open: boolean;
  value: string;
  onChange: (_v: string) => void;
  onClose: () => void;
  onExecute: (_cmd: CommandLike, _input: string) => void;
  commands: CommandLike[];
};

export function useCommandPalette({
  open,
  value,
  onChange,
  onClose,
  onExecute,
  commands,
}: UseCommandPaletteArgs) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState<number | null>(null);
  const HIST_KEY = 'liriac:cmdHistory';

  // Computed suggestion and completion tail
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
    } catch {
      /* ignore */
    }
  }, []);

  // Reset history cursor whenever the bar opens
  useEffect(() => {
    if (open) setHistIdx(null);
  }, [open]);

  // Focus when opening
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  function addToHistory(entry: string) {
    const clean = entry.trim();
    if (!clean) return;
    setHistory((h) => {
      const next = [clean, ...h.filter((x) => x !== clean)].slice(0, 50);
      try {
        localStorage.setItem(HIST_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function onInputChange(next: string) {
    if (histIdx !== null) setHistIdx(null);
    onChange(next);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    const isEmpty = value.trim().length === 0;

    if (e.key === 'ArrowUp') {
      if (isEmpty && history.length > 0) {
        e.preventDefault();
        const nextIdx =
          histIdx === null ? 0 : Math.min(histIdx + 1, history.length - 1);
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

  return {
    inputRef,
    suggestion,
    completionTail,
    onInputChange,
    handleKeyDown,
  };
}
