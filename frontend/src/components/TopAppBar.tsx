export default function TopAppBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)] backdrop-blur transition-opacity duration-200">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <h1 className="text-sm font-medium text-[var(--muted)]">
          <span className="font-semibold text-[var(--fg)]">liriac</span>
          <span className="px-2 text-[var(--muted)]">—</span>
          <span className="hidden sm:inline">Book:</span>{' '}
          <span className="italic">"El viajero"</span>
          <span className="px-2 text-[var(--muted)]">—</span>
          <span className="hidden sm:inline">Chapter 03:</span>{' '}
          <span className="italic">"El puerto"</span>
        </h1>
      </div>
    </header>
  );
}
