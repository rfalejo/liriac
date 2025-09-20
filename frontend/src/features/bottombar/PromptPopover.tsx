import { useEffect, useRef, useState } from 'react';
import { useBottomBar, useBottomBarState } from './context';

export function PromptPopover() {
  const { editor } = useBottomBarState();
  const { closePrompt, pushMessage } = useBottomBar();
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const open = !!editor?.promptOpen;

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => textareaRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-popover-title"
      className="fixed bottom-12 right-4 z-40 w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-zinc-300 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 id="prompt-popover-title" className="text-sm font-semibold">
          Prompt
        </h2>
        <button
          type="button"
          className="text-xs px-2 py-1 rounded border border-zinc-300 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-zinc-700 dark:hover:bg-zinc-800"
          onClick={closePrompt}
        >
          Esc · Close
        </button>
      </div>
      <label htmlFor="prompt-input" className="sr-only">
        Enter prompt text
      </label>
      <textarea
        id="prompt-input"
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            closePrompt();
          }
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // For now: dev/test mock, just show a message and close
            pushMessage({ text: 'Prompt submitted (mock)', tone: 'info' });
            closePrompt();
          }
        }}
        className="w-full h-28 resize-none rounded-md border border-zinc-300 bg-white p-2 text-sm leading-relaxed shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
        placeholder="Describe what you want to generate…"
      />
      <p id="prompt-help" className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
        Enter to submit · Shift+Enter for newline · Esc to close
      </p>
    </div>
  );
}

export default PromptPopover;
