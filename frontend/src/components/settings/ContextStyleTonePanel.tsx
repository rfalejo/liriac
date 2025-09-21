import React from 'react';

export type StyleGuideItem = {
  id: string;
  text: string;
  tokens?: number;
};

export type ContextStyleTonePanelProps = {
  title?: string;
  styleGuide?: StyleGuideItem[];
  tones?: { id: string; label: string; active?: boolean }[];
  defaultOpen?: boolean;
};

export default function ContextStyleTonePanel({
  title = 'Writing style & tone',
  styleGuide = [],
  tones = [],
  defaultOpen,
}: ContextStyleTonePanelProps) {
  const badgeCount = (styleGuide?.length ?? 0) > 0 ? 1 : 0;

  return (
    <details className="rounded border border-[var(--border)]" open={defaultOpen}>
      <summary className="flex items-center justify-between cursor-pointer select-none px-3 py-2 text-sm">
        <span className="text-[var(--fg)]">{title}</span>
        <span className="ml-2 rounded bg-black/20 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
          {badgeCount}
        </span>
      </summary>
      <div className="px-3 pb-3 text-sm text-[var(--muted)]">
        {styleGuide.length > 0 && (
          <>
            <div className="mb-2 text-xs">Style guide</div>
            <ul className="space-y-1 mb-3">
              {styleGuide.map((g) => (
                <li key={g.id} className="flex items-center justify-between">
                  <span>• {g.text}</span>
                  {typeof g.tokens === 'number' && <span className="text-xs">~{g.tokens}t</span>}
                </li>
              ))}
            </ul>
          </>
        )}
        {tones.length > 0 && (
          <>
            <div className="mb-2 text-xs">Tone</div>
            <div className="flex flex-wrap gap-1">
              {tones.map((t) => (
                <span
                  key={t.id}
                  className={`rounded border border-[var(--border)] ${
                    t.active ? 'bg-black/20' : 'bg-black/10'
                  } px-2 py-0.5 text-xs`}
                >
                  {t.label}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </details>
  );
}
