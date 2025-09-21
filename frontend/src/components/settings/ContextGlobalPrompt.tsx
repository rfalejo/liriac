export type ContextGlobalPromptProps = {
  title?: string;
  prompt: string;
  badgeCount?: number;
  defaultOpen?: boolean;
};

export default function ContextGlobalPrompt({
  title = 'Global',
  prompt,
  badgeCount = 1,
  defaultOpen = true,
}: ContextGlobalPromptProps) {
  return (
    <details open={defaultOpen} className="rounded border border-[var(--border)]">
      <summary className="flex items-center justify-between cursor-pointer select-none px-3 py-2 text-sm">
        <span className="text-[var(--fg)]">{title}</span>
        <span className="ml-2 rounded bg-black/20 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
          {badgeCount}
        </span>
      </summary>
      <div className="px-3 pb-3">
        <div className="text-xs text-[var(--muted)] mb-1">
          System prompt (always included)
        </div>
        <div className="rounded border border-[var(--border)] bg-black/10 p-2 text-xs text-[var(--muted)]">
          {prompt}
        </div>
      </div>
    </details>
  );
}
