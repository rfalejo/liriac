import { useEffect, useRef, useState } from 'react';

type Toast = {
  id: number;
  text: string;
};

function messageForCommand(id: string): string {
  switch (id) {
    case 'undo':
      return 'Undo complete.';
    case 'redo':
      return 'Redo complete.';
    case 'spell':
      return 'Spell-check complete.';
    case 'outline':
      return 'Outline generated.';
    case 'rewrite-tone':
      return 'Paragraph rewritten.';
    case 'insert-break':
      return 'Scene break inserted.';
    case 'count':
      return 'Word count calculated.';
    case 'timer-start':
      return 'Timer started (25m).';
    default:
      return 'Command executed.';
  }
}

export default function Toasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(1);

  useEffect(() => {
    function push(text: string) {
      const id = idRef.current++;
      setToasts((t) => {
        const next = [...t, { id, text }].slice(-2); // keep last 2
        return next;
      });
      window.setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, 2500);
    }

    function onToast(e: Event) {
      const ev = e as CustomEvent<{ text?: string }>;
      const text = ev.detail?.text;
      if (typeof text === 'string' && text.trim()) push(text.trim());
    }

    function onEditorCommand(e: Event) {
      const ev = e as CustomEvent<{ id?: string; input?: string }>;
      const id = ev.detail?.id ?? '';
      push(messageForCommand(id));
    }

    window.addEventListener('toast:show', onToast as EventListener);
    window.addEventListener('editor:command', onEditorCommand as EventListener);
    return () => {
      window.removeEventListener('toast:show', onToast as EventListener);
      window.removeEventListener('editor:command', onEditorCommand as EventListener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-live="polite"
          className="pointer-events-auto select-none rounded-md border border-[var(--border)] bg-[var(--surface)]/95 px-3 py-1.5 text-sm text-[var(--fg)] shadow-lg backdrop-blur"
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
