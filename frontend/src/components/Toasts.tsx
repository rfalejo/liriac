import { useAppStore } from '../store/appStore';

export default function Toasts() {
  const { toasts } = useAppStore();

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
