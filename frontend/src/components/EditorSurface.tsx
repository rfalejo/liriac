import { useRef, useState, useMemo } from 'react';
import CommandBar from './CommandBar';
import { typewriterScroll } from '../utils/caret';
import { gotoTop, gotoScene, jumpToOffset } from '../utils/scenes';
import { useSmartPunctuation } from '../hooks/useSmartPunctuation';
import {
  COMMANDS as REGISTRY,
  type Command as Cmd,
  executeCommand,
} from '../commands/commands';
import { useEditorStats } from '../hooks/useEditorStats';
import { useEditorShortcuts } from '../hooks/useEditorShortcuts';
import { useAppStore } from '../store/appStore';

export default function EditorSurface({ disabled = false }: { disabled?: boolean }) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const { transform } = useSmartPunctuation();
  useEditorStats(textareaRef);
  const { showToast, openSettings } = useAppStore();

  // Show a one-time toast when smart punctuation first triggers
  const smartToastShown = useRef(false);

  function showSmartToastOnce() {
    if (smartToastShown.current) return;
    smartToastShown.current = true;
    showToast('Smart punctuation enabled (quotes and em-dashes).');
  }

  // Track last edit position for /goto last-edit
  const lastEditRef = useRef<number | null>(null);

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
  }

  const { handleKeyDown } = useEditorShortcuts({
    textareaRef,
    disabled,
    openCommand: (initial = '') => {
      setCommandOpen(true);
      setCommandInput(initial);
    },
  });

  const suggestions = useMemo<Cmd[]>(() => REGISTRY, []);

  return (
    <main className="flex flex-col flex-1 min-h-0">
      <div className="mx-auto flex flex-1 min-h-0 w-full max-w-4xl flex-col px-4 py-8 sm:px-6 sm:py-10 lg:max-w-3xl">
        <div className="mt-6 flex-1 min-h-0 flex flex-col border-b border-[var(--border)] bg-[var(--surface)]/80 transition-colors duration-150">
          <label htmlFor="editor" className="sr-only">
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
        onExecute={(cmd, input) => {
          const el = textareaRef.current;
          executeCommand(cmd as Cmd, input, {
            textareaEl: el,
            gotoTop: () => {
              if (el) gotoTop(el);
            },
            gotoLastEdit: () => {
              if (el) jumpToOffset(el, lastEditRef.current ?? 0);
            },
            gotoScene: (n: number) => {
              if (el) gotoScene(el, n);
            },
            openSettings: () => {
              openSettings();
            },
            closePalette: () => {
              setCommandOpen(false);
              setCommandInput('');
              if (!disabled) {
                requestAnimationFrame(() => textareaRef.current?.focus());
              }
            },
            toast: (text: string) => {
              showToast(text);
            },
          });
        }}
        commands={suggestions}
      />
    </main>
  );
}
