import React from 'react';

export type TokenBarProps = {
  used: number;
  budget: number;
  className?: string;
  ariaLabel?: string;
};

export default function ContextTokenBar({
  used,
  budget,
  className,
  ariaLabel,
}: TokenBarProps) {
  const safeBudget = Math.max(1, budget);
  const pct = Math.min(100, Math.round((Math.max(0, used) / safeBudget) * 100));

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-[var(--muted)]">Estimated tokens</span>
        <span
          className="text-sm text-[var(--fg)]"
          aria-label={ariaLabel ?? 'Token usage'}
        >
          {used} / {safeBudget} (~{pct}%)
        </span>
      </div>
      <div
        className="h-2 w-full rounded bg-black/20 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeBudget}
        aria-valuenow={Math.min(used, safeBudget)}
      >
        <div
          className={`h-full ${pct < 80 ? 'bg-emerald-500/70' : pct < 100 ? 'bg-amber-500/80' : 'bg-red-500/80'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
