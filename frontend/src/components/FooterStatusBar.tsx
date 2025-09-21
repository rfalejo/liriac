export default function FooterStatusBar({
  tokens = 0,
  onOpenContext,
}: {
  tokens?: number;
  onOpenContext?: () => void;
}) {
  return (
    <footer className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--surface)] py-2 text-sm text-[var(--muted)] backdrop-blur transition-opacity duration-200">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 sm:px-6">
        <span>
          <span className="font-medium text-[var(--fg)]">Mode:</span> Write
        </span>
        <span
          className="footer-sep cursor-pointer select-none"
          role="button"
          tabIndex={0}
          onClick={() => onOpenContext?.()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onOpenContext?.();
          }}
          aria-label="Open context editor"
          title="Open context editor (Ctrl+,)"
        >
          <span className="font-medium text-[var(--fg)]">Context:</span> 10%
        </span>
        <span className="footer-sep hidden sm:inline">Ln 12, Col 1</span>
        <span className="footer-sep hidden md:inline">Autosave: active (every 10s)</span>
      </div>
    </footer>
  );
}
