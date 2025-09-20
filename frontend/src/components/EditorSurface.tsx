export default function EditorSurface() {
  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:max-w-3xl">
        <article className="prose prose-invert max-w-none">
          <p>The pier smelled of salt and damp wood.</p>
          <p>
            Gulls carved lazy circles above the flat water while ropes creaked with every swell.
          </p>
          <p>
            Camila pressed the notebook to her chest and exhaled deeply. She expected no answers,
            only the murmur of the sea and the thud of her boots.
          </p>
          <p>…</p>
        </article>

        {/* Placeholder for a textarea-like editor surface */}
        <div className="mt-6 rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <label
            htmlFor="editor"
            className="sr-only"
          >
            Chapter body
          </label>
          <textarea
            id="editor"
            spellCheck={false}
            className="block h-[50vh] w-full resize-y bg-transparent p-4 font-serif text-base leading-relaxed text-[var(--fg)] outline-none placeholder:text-[var(--muted)]"
            placeholder="Start writing here…"
            defaultValue={`The pier smelled of salt and damp wood.\n\nGulls carved lazy circles above the flat water while ropes creaked with every swell.\n\nCamila pressed the notebook to her chest and exhaled deeply. She expected no answers, only the murmur of the sea and the thud of her boots.\n\n…`}
          />
        </div>
      </div>
    </main>
  );
}
