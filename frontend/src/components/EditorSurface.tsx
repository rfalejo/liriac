import { useEffect, useRef, useState, useMemo } from 'react';
import CommandBar, { type Command as CommandBarCommand } from './CommandBar';
import { mockTokenize } from '../utils/tokens';
import { typewriterScroll } from '../utils/caret';
import { gotoScene as utilGotoScene, gotoTop as utilGotoTop, jumpToOffset, getSceneOffsets } from '../utils/scenes';
import { useSmartPunctuation } from '../hooks/useSmartPunctuation';
import { COMMANDS as REGISTRY, executeCommand, type Command as Cmd } from '../commands/commands';

function normalizeCmd(s: string) {
  return s.replace(/^\//, '');
}

function computeSuggestion(commands: CommandBarCommand[], value: string): string | null {
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

function findCommand(commands: CommandBarCommand[], input: string): CommandBarCommand | undefined {
  const q = normalizeCmd(input.trim()).toLowerCase();
  return commands.find(
    (c) =>
      c.label.toLowerCase() === q ||
      (c.aliases ?? []).some((a) => normalizeCmd(a).toLowerCase() === q),
  );
}

export default function EditorSurface({ disabled = false }: { disabled?: boolean }) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const { transform } = useSmartPunctuation();

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

  function gotoScene(n: number) {
    const el = textareaRef.current;
    if (!el) return;
    utilGotoScene(el, n);
    typewriterScroll(el);
  }

  function gotoTop() {
    const el = textareaRef.current;
    if (!el) return;
    utilGotoTop(el);
    typewriterScroll(el);
  }

  function gotoLastEdit() {
    const el = textareaRef.current;
    const pos = lastEditRef.current;
    if (!el || pos == null) return;
    jumpToOffset(el, pos);
    typewriterScroll(el);
  }

  // Keep focus on the editor unless the CommandBar is open
  function handleBlur() {
    if (!commandOpen && !disabled) {
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget as HTMLTextAreaElement;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;

    // Apply smart punctuation transform around caret
    const res = transform(el.value, start, end);
    if (res.didSmart) {
      el.value = res.value;
      el.selectionStart = res.selectionStart;
      el.selectionEnd = res.selectionEnd;
      showSmartToastOnce();
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
      setTimeout(() => typewriterScroll(el), 0);
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

  function execute(cmd: Cmd, rawInput: string) {
    executeCommand(cmd, rawInput, {
      textareaEl: textareaRef.current,
      gotoTop,
      gotoLastEdit,
      gotoScene,
      closePalette: () => {
        setCommandOpen(false);
        setCommandInput('');
        if (!disabled) {
          requestAnimationFrame(() => textareaRef.current?.focus());
        }
      },
      toast(text: string) {
        if (text) {
          window.dispatchEvent(new CustomEvent('toast:show', { detail: { text } }));
        }
      },
      emit(id: string, input: string) {
        window.dispatchEvent(new CustomEvent('editor:command', { detail: { id, input } }));
      },
    });
  }

  const suggestions = useMemo<CommandBarCommand[]>(() => REGISTRY, []);
  const suggestion = computeSuggestion(suggestions, commandInput);
  const completionTail =
    suggestion && commandInput.trim().startsWith('/')
      ? suggestion.slice(commandInput.trim().replace(/^\//, '').length)
      : '';

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
            disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            aria-hidden={disabled ? true : undefined}
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
          if (!disabled) {
            // Restore focus to the chapter textarea so the caret is active again
            requestAnimationFrame(() => textareaRef.current?.focus());
          }
        }}
        onExecute={(cmd, input) => execute(cmd as Cmd, input)}
        commands={suggestions}
      />
    </main>
  );
}
