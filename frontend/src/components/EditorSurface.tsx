import { useEffect, useRef } from 'react';

function mockTokenize(text: string): number {
  // Very rough mock: ~4 chars per token average
  const len = text.trim().length;
  return len === 0 ? 0 : Math.ceil(len / 4);
}

export default function EditorSurface() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
          />
        </div>
      </div>
    </main>
  );
}
