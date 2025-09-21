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
  { id: 'goto', label: 'goto', hint: 'Jump: /goto top | last-edit | scene N', aliases: ['/goto'] },
  { id: 'context', label: 'context', hint: 'Open context editor', aliases: ['/context'] },
];

export default function EditorSurface() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandInput, setCommandInput] = useState('');

  // Show a one-time toast when smart punctuation first triggers
  const smartToastShown = useRef(false);

  function showSmartToastOnce() {
    if (smartToastShown.current) return;
    smartToastShown.current = true;
    window.dispatchEvent(
      new CustomEvent('toast:show', {
        detail: { text: 'Smart punctuation enabled (quotes and em-dashes).' },
      }),
    );
  }

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    // Initialize tokens from initial value
    const tokens = mockTokenize(el.value || '');
    window.dispatchEvent(new CustomEvent('editor:stats', { detail: { tokens } }));
  }, []);

  // Track last edit position for /goto last-edit
  const lastEditRef = useRef<number | null>(null);

  // Scene helpers
  function getSceneOffsets(text: string): number[] {
    // Scenes are separated by blank-line + *** + blank-line
    const breaks: number[] = [0];
    const re = /\n\*\*\*\n/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      breaks.push(m.index + m[0].length);
    }
    return breaks;
  }

  function jumpToOffset(el: HTMLTextAreaElement, offset: number) {
    const pos = Math.max(0, Math.min(offset, el.value.length));
    el.selectionStart = el.selectionEnd = pos;
    typewriterScroll(el);
    // Ensure focus is on the editor
    el.focus();
  }

  function gotoScene(n: number) {
    const el = textareaRef.current;
    if (!el) return;
    const offs = getSceneOffsets(el.value);
    const idx = Math.max(0, Math.min(n - 1, offs.length - 1));
    jumpToOffset(el, offs[idx]);
  }

  function gotoTop() {
    const el = textareaRef.current;
    if (!el) return;
    jumpToOffset(el, 0);
  }

  function gotoLastEdit() {
    const el = textareaRef.current;
    const pos = lastEditRef.current;
    if (!el || pos == null) return;
    jumpToOffset(el, pos);
  }

  // Compute caret Y (relative to content) using a hidden mirror element
  function getCaretTop(el: HTMLTextAreaElement): number {
    const style = window.getComputedStyle(el);
    const div = document.createElement('div');
    const span = document.createElement('span');

    div.style.position = 'absolute';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.visibility = 'hidden';
    div.style.zIndex = '-9999';
    div.style.font = style.font;
    div.style.lineHeight = style.lineHeight;
    div.style.padding = style.padding;
    div.style.border = style.border;
    div.style.boxSizing = style.boxSizing;
    div.style.width = el.clientWidth + 'px';

    const selStart = el.selectionStart ?? 0;
    const before = el.value.slice(0, selStart);
    const after = el.value.slice(selStart) || '.';

    div.textContent = before;
    span.textContent = after;
    div.appendChild(span);
    document.body.appendChild(div);
    const top = span.offsetTop;
    document.body.removeChild(div);
    return top;
  }

  // Keep caret ~40% from top; limit per-tick scroll to avoid jumps
  function typewriterScroll(el: HTMLTextAreaElement) {
    try {
      const caretTop = getCaretTop(el);
      const desired = Math.max(0, caretTop - el.clientHeight * 0.4);
      const delta = desired - el.scrollTop;
      if (Math.abs(delta) > 4) {
        const step = Math.sign(delta) * Math.min(Math.abs(delta), 120);
        el.scrollTop += step;
      }
    } catch {
      // no-op on failure; better to do nothing than throw during typing
    }
  }
  
  // Keep focus on the editor unless the CommandBar is open
  function handleBlur() {
    if (!commandOpen) {
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }
  
  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget as HTMLTextAreaElement;
    let value = el.value;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? start;

    // Inline smart punctuation heuristics focused around the caret
    // 1) Em-dash: turn "--" immediately before caret into "—"
    if (start === end && start >= 2 && value.slice(start - 2, start) === '--') {
      value = value.slice(0, start - 2) + '—' + value.slice(start);
      const nextPos = start - 1; // caret moves back by one due to replacement
      el.value = value;
      el.selectionStart = el.selectionEnd = nextPos;
      showSmartToastOnce();
    }

    // 2) Smart quotes for the just-typed straight quotes near caret
    // Handle double quotes
    if (start === end && start >= 1 && value[start - 1] === '"') {
      const before = value.slice(0, start - 1);
      const prevNonSpace = before.match(/[^\s\(\[\{]$/)?.[0];
      const isOpening = !prevNonSpace || /[\s\(\[\{]/.test(before.slice(-1));
      const curly = isOpening ? '“' : '”';
      value = value.slice(0, start - 1) + curly + value.slice(start);
      el.value = value;
      el.selectionStart = el.selectionEnd = start;
      showSmartToastOnce();
    }

    // Handle single quotes vs apostrophes
    if (start === end && start >= 1 && value[start - 1] === "'") {
      const before = value.slice(0, start - 1);
      const after = value.slice(start);
      // Apostrophe in contractions: letter'letter
      if (/[A-Za-z]$/.test(before) && /^[A-Za-z]/.test(after)) {
        const curly = '’';
        value = value.slice(0, start - 1) + curly + value.slice(start);
        el.value = value;
        el.selectionStart = el.selectionEnd = start;
        showSmartToastOnce();
      } else {
        const prevNonSpace = before.match(/[^\s\(\[\{]$/)?.[0];
        const isOpening = !prevNonSpace || /[\s\(\[\{]/.test(before.slice(-1));
        const curly = isOpening ? '‘' : '’';
        value = value.slice(0, start - 1) + curly + value.slice(start);
        el.value = value;
        el.selectionStart = el.selectionEnd = start;
        showSmartToastOnce();
      }
    }

    // Typewriter scroll: keep caret ~40% from top
    typewriterScroll(el);
    // Track last edit position
    lastEditRef.current = el.selectionStart ?? el.value.length;

    // Update stats after any transformation
    const tokens = mockTokenize(el.value);
    window.dispatchEvent(new CustomEvent('editor:stats', { detail: { tokens } }));
  }

  function atLineStart(el: HTMLTextAreaElement) {
    const pos = el.selectionStart ?? 0;
    if (pos === 0) return true;
    const prevChar = el.value[pos - 1];
    return prevChar === '\n';
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === '.') {
      e.preventDefault();
      setCommandOpen(true);
      setCommandInput('');
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
        return;
      }
    }

    // Navigation without UI: jump between scene breaks
    if ((e.metaKey || e.ctrlKey) && e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      const el = e.currentTarget as HTMLTextAreaElement;
      const pos = el.selectionStart ?? 0;
      const offs = getSceneOffsets(el.value);
      // Find current scene index
      let idx = 0;
      for (let i = 0; i < offs.length; i++) {
        if (offs[i] <= pos) idx = i;
        else break;
      }
      const nextIdx = e.key === 'ArrowLeft' ? Math.max(0, idx - 1) : Math.min(offs.length - 1, idx + 1);
      jumpToOffset(el, offs[nextIdx]);
      return;
    }

    // After navigation keys, re-center the caret (typewriter scroll)
    const navKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Enter']);
    if (navKeys.has(e.key)) {
      setTimeout(() => {
        const el = e.currentTarget as HTMLTextAreaElement;
        if (el) typewriterScroll(el);
      }, 0);
    }
  }

  function executeCommand(cmd: Command, rawInput: string) {
    // Minimal behavior for demo; real handlers would manipulate text/selection.

    // Open context editor
    if (cmd.id === 'context') {
      window.dispatchEvent(new CustomEvent('context:open'));
      setCommandOpen(false);
      setCommandInput('');
      return;
    }

    // Goto navigation: /goto top | last-edit | scene N | N
    if (cmd.id === 'goto') {
      const raw = rawInput.trim();
      const norm = raw.startsWith('/') ? raw.slice(1) : raw;
      const parts = norm.split(/\s+/).filter(Boolean); // e.g., ['goto','scene','3']
      const args = parts.slice(1);

      if (args.length === 0) {
        // No args: do nothing
      } else {
        const head = args[0].toLowerCase();
        if (head === 'top') {
          gotoTop();
        } else if (head === 'last-edit' || head === 'last' || head === 'lastedit') {
          gotoLastEdit();
        } else if (head === 'scene' && args[1]) {
          const n = parseInt(args[1], 10);
          if (!Number.isNaN(n) && n > 0) gotoScene(n);
        } else {
          // Maybe a plain number: /goto 3
          const n = parseInt(head, 10);
          if (!Number.isNaN(n) && n > 0) gotoScene(n);
        }
      }

      setCommandOpen(false);
      setCommandInput('');
      return;
    }

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
        <div className="mt-6 flex-1 min-h-0 flex flex-col border-b border-[var(--border)] bg-[var(--surface)]/80 transition-colors duration-150">
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
            className="block w-full flex-1 min-h-0 resize-none bg-transparent p-6 sm:p-8 font-serif text-[1.05rem] sm:text-[1.125rem] leading-[var(--read-lh)] text-[var(--fg)] outline-none placeholder:text-[var(--muted)] mx-auto max-w-[70ch] caret-[var(--fg)]"
            placeholder="Start writing here…"
            defaultValue={`The pier smelled of salt and damp wood.\n\nGulls carved lazy circles above the flat water while ropes creaked with every swell.\n\nMichelle pressed the notebook to her chest and exhaled deeply. She expected no answers, only the murmur of the sea and the thud of her boots.\n\n…`}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
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
          // Restore focus to the chapter textarea so the caret is active again
          requestAnimationFrame(() => textareaRef.current?.focus());
        }}
        onExecute={executeCommand}
        commands={suggestions}
      />
    </main>
  );
}
