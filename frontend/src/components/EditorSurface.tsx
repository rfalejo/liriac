export default function EditorSurface() {
  return (
    <main className="flex flex-col flex-1 min-h-0">
      <div className="mx-auto flex flex-1 min-h-0 w-full max-w-4xl flex-col px-4 py-6 sm:px-6 lg:max-w-3xl">
        <div className="mt-6 flex-1 min-h-0 flex flex-col rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <label
            htmlFor="editor"
            className="sr-only"
          >
            Chapter body
          </label>
          <textarea
            id="editor"
            spellCheck={false}
            className="block w-full flex-1 min-h-0 resize-none bg-transparent p-4 font-serif text-base leading-relaxed text-[var(--fg)] outline-none placeholder:text-[var(--muted)]"
            placeholder="Start writing here…"
            defaultValue={`The pier smelled of salt and damp wood.\n\nGulls carved lazy circles above the flat water while ropes creaked with every swell.\n\nCamila pressed the notebook to her chest and exhaled deeply. She expected no answers, only the murmur of the sea and the thud of her boots.\n\n…`}
          />
        </div>
      </div>
    </main>
  );
}
