export default function FooterStatusBar() {
  return (
    <footer className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--surface)] py-2 text-sm text-[var(--muted)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 sm:px-6">
        <span>
          <span className="font-medium text-[var(--fg)]">Mode:</span> Manual
        </span>
        <span className="hidden sm:inline text-[var(--muted)]">•</span>
        <span>Book: El viajero</span>
        <span className="hidden sm:inline text-[var(--muted)]">•</span>
        <span>Chapter: 03</span>
        <span className="hidden sm:inline text-[var(--muted)]">•</span>
        <span>Ln 12, Col 1</span>
        <span className="hidden sm:inline text-[var(--muted)]">•</span>
        <span>Autosave: active (every 10s)</span>
      </div>
    </footer>
  );
}
