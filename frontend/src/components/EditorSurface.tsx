import { useEffect, useRef, useState, useMemo } from 'react';
import CommandBar, { type Command } from './CommandBar';

function mockTokenize(text: string): number {
  // Very rough mock: ~4 chars per token average
  const len = text.trim().length;
  return len === 0 ? 0 : Math.ceil(len / 4);
}

const COMMANDS: Command[] = [
  { id: 'undo', label: 'undo', hint: 'Revert last action', aliases: ['/undo'] },
  { id: 'redo', label: 'redo', hint: 'Re-apply last reverted action' },
  { id: 'spell', label: 'spell-check', hint: 'Check spelling in selection', aliases: ['spell', '/spell-check'] },
  { id: 'outline', label: 'outline generate', hint: 'Generate chapter outline' },
  { id: 'rewrite-tone', label: 'rewrite paragraph tone: moody', hint: 'Rewrite selection with tone' },
  { id: 'insert-break', label: 'insert scene break', hint: 'Add a scene separator' },
  { id: 'count', label: 'count words', hint: 'Show word count' },
  { id: 'timer-start', label: 'timer start 25m', hint: 'Start a 25m session' },
];

export default function EditorSurface() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    // Initialize tokens from initial value
    const tokens = mockTokenize(el.value || '');
    window.dispatchEvent(new CustomEvent('editor:stats', { detail: { tokens } }));
  }, []);

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const value = (e.currentTarget as HTMLTextAreaElement).value;
    const tokens = mockTokenize(value);
    window.dispatchEvent(new CustomEvent('editor:stats', { detail: { tokens } }));
  }

  function atLineStart(el: HTMLTextAreaElement) {
    const pos = el.selectionStart ?? 0;
    if (pos === 0) return true;
    const prevChar = el.value[pos - 1];
    return prevChar === '\n';
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setCommandOpen(true);
      setCommandInput('');
      setHistoryIdx(null);
      return;
    }
    if ((e.key === '>' || e.key === '/') && !e.shiftKey) {
      // '>' might require Shift on many layouts. We use either '/' or '>'.
      // Only open at the start of a line to keep the flow clean.
      const el = e.currentTarget as HTMLTextAreaElement;
      if (atLineStart(el)) {
        e.preventDefault();
        setCommandOpen(true);
        setCommandInput('');
        setHistoryIdx(null);
        return;
      }
    }
  }

  function executeCommand(cmd: Command, rawInput: string) {
    // Minimal behavior for demo; real handlers would manipulate text/selection.
    // Keep a tiny command history
    setHistory((h) => [rawInput || cmd.label, ...h].slice(0, 20));
    setHistoryIdx(null);

    // Example: insert scene break where the caret is
    if (cmd.id === 'insert-break') {
      const el = textareaRef.current;
      if (el) {
        const v = el.value;
        const start = el.selectionStart ?? v.length;
        const end = el.selectionEnd ?? start;
        const insert = '\n\n***\n\n';
        const next = v.slice(0, start) + insert + v.slice(end);
        el.value = next;
        // Move caret after insertion
        const caret = start + insert.length;
        el.selectionStart = el.selectionEnd = caret;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    // Dispatch a light result event (can be hooked later for toasts)
    window.dispatchEvent(
      new CustomEvent('editor:command', { detail: { id: cmd.id, input: rawInput } }),
    );

    setCommandOpen(false);
    setCommandInput('');
  }

  const suggestions = useMemo(() => COMMANDS, []);

  return (
    <main className="flex flex-col flex-1 min-h-0">
      <div className="mx-auto flex flex-1 min-h-0 w-full max-w-4xl flex-col px-4 py-8 sm:px-6 sm:py-10 lg:max-w-3xl">
        <div className="mt-6 flex-1 min-h-0 flex flex-col rounded-md sm:rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm transition-shadow duration-150">
          <label
            htmlFor="editor"
            className="sr-only"
          >
            Chapter body
          </label>
          <textarea
            ref={textareaRef}
            id="editor"
            spellCheck={false}
            className="block w-full flex-1 min-h-0 resize-none bg-transparent p-6 sm:p-8 font-serif text-[1.05rem] sm:text-[1.125rem] leading-[1.85] text-[var(--fg)] outline-none placeholder:text-[var(--muted)] mx-auto max-w-[70ch] caret-[var(--fg)]"
            placeholder="Start writing here…"
            defaultValue={`The pier smelled of salt and damp wood.\n\nGulls carved lazy circles above the flat water while ropes creaked with every swell.\n\nCamila pressed the notebook to her chest and exhaled deeply. She expected no answers, only the murmur of the sea and the thud of her boots.\n\n…`}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>

      <CommandBar
        open={commandOpen}
        value={commandInput}
        onChange={(v) => setCommandInput(v)}
        onClose={() => {
          setCommandOpen(false);
          setCommandInput('');
          setHistoryIdx(null);
        }}
        onExecute={executeCommand}
        commands={suggestions}
      />
    </main>
  );
}
