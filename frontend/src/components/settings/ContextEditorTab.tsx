export default function ContextEditorTab({ tokens }: { tokens: number }) {
  const budget = 2000;
  const used = Math.max(0, tokens);
  const pct = Math.min(100, Math.round((used / budget) * 100));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        <details data-panel className="rounded border border-[var(--border)]">
          <summary className="flex items-center justify-between cursor-pointer select-none px-3 py-2 text-sm">
            <span className="text-[var(--fg)]">Chapters</span>
            <span className="ml-2 rounded bg-black/20 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">1</span>
          </summary>
          <div className="px-3 pb-3 text-sm text-[var(--muted)]">
            <ul className="space-y-1">
              <li className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" tabIndex={-1} defaultChecked className="accent-[var(--fg)]" />
                  <span>03 — El puerto</span>
                </label>
                <span className="text-xs">~680t</span>
              </li>
              <li className="flex items-center justify-between gap-3 opacity-60">
                <label className="flex items-center gap-2">
                  <input type="checkbox" tabIndex={-1} className="accent-[var(--fg)]" />
                  <span>02 — Preparativos</span>
                </label>
                <span className="text-xs">~540t</span>
              </li>
              <li className="flex items-center justify-between gap-3 opacity-60">
                <label className="flex items-center gap-2">
                  <input type="checkbox" tabIndex={-1} className="accent-[var(--fg)]" />
                  <span>04 — Mareas</span>
                </label>
                <span className="text-xs">~720t</span>
              </li>
            </ul>
          </div>
        </details>

        <details data-panel className="rounded border border-[var(--border)]">
          <summary className="flex items-center justify-between cursor-pointer select-none px-3 py-2 text-sm">
            <span className="text-[var(--fg)]">Characters</span>
            <span className="ml-2 rounded bg-black/20 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">2</span>
          </summary>
          <div className="px-3 pb-3 text-sm text-[var(--muted)]">
            <ul className="space-y-1">
              <li className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" tabIndex={-1} defaultChecked className="accent-[var(--fg)]" />
                  <span>Michelle — Protagonist</span>
                </label>
                <span className="text-xs">~120t</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" tabIndex={-1} defaultChecked className="accent-[var(--fg)]" />
                  <span>Arturo — Supporting</span>
                </label>
                <span className="text-xs">~80t</span>
              </li>
              <li className="flex items-center justify-between gap-3 opacity-60">
                <label className="flex items-center gap-2">
                  <input type="checkbox" tabIndex={-1} className="accent-[var(--fg)]" />
                  <span>Port Authority — Minor</span>
                </label>
                <span className="text-xs">~40t</span>
              </li>
            </ul>
          </div>
        </details>

        <details data-panel className="rounded border border-[var(--border)]">
          <summary className="flex items-center justify-between cursor-pointer select-none px-3 py-2 text-sm">
            <span className="text-[var(--fg)]">World info</span>
            <span className="ml-2 rounded bg-black/20 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">1</span>
          </summary>
          <div className="px-3 pb-3 text-sm text-[var(--muted)]">
            <ul className="space-y-1">
              <li className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" tabIndex={-1} defaultChecked className="accent-[var(--fg)]" />
                  <span>The Port of San Aurelio</span>
                </label>
                <span className="text-xs">~150t</span>
              </li>
              <li className="flex items-center justify-between gap-3 opacity-60">
                <label className="flex items-center gap-2">
                  <input type="checkbox" tabIndex={-1} className="accent-[var(--fg)]" />
                  <span>Ferry schedules</span>
                </label>
                <span className="text-xs">~60t</span>
              </li>
            </ul>
          </div>
        </details>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-[var(--muted)]">Estimated tokens</span>
            <span className="text-sm text-[var(--fg)]">
              {used} / {budget} (~{pct}%)
            </span>
          </div>
          <div className="h-2 w-full rounded bg-black/20 overflow-hidden">
            <div
              className={`h-full ${pct < 80 ? 'bg-emerald-500/70' : pct < 100 ? 'bg-amber-500/80' : 'bg-red-500/80'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <details open className="rounded border border-[var(--border)]">
          <summary className="flex items-center justify-between cursor-pointer select-none px-3 py-2 text-sm">
            <span className="text-[var(--fg)]">Global</span>
            <span className="ml-2 rounded bg-black/20 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">1</span>
          </summary>
          <div className="px-3 pb-3">
            <div className="text-xs text-[var(--muted)] mb-1">System prompt (always included)</div>
            <div className="rounded border border-[var(--border)] bg-black/10 p-2 text-xs text-[var(--muted)]">
              You are a helpful writing assistant. Follow the author’s intent, preserve facts, and avoid spoilers beyond the current scope.
            </div>
          </div>
        </details>

        <details className="rounded border border-[var(--border)]">
          <summary className="flex items-center justify-between cursor-pointer select-none px-3 py-2 text-sm">
            <span className="text-[var(--fg)]">Writing style & tone</span>
            <span className="ml-2 rounded bg-black/20 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">1</span>
          </summary>
          <div className="px-3 pb-3 text-sm text-[var(--muted)]">
            <div className="mb-2 text-xs">Style guide</div>
            <ul className="space-y-1 mb-3">
              <li className="flex items-center justify-between">
                <span>• House style: concise, sensory details</span>
                <span className="text-xs">~120t</span>
              </li>
            </ul>
            <div className="mb-2 text-xs">Tone</div>
            <div className="flex flex-wrap gap-1">
              <span className="rounded border border-[var(--border)] bg-black/20 px-2 py-0.5 text-xs">Moody</span>
              <span className="rounded border border-[var(--border)] bg-black/10 px-2 py-0.5 text-xs">Lyrical</span>
            </div>
          </div>
        </details>

        <p className="text-xs text-[var(--muted)]">
          This is a mock. Interactions and persistence will be added next.
        </p>
      </div>
    </div>
  );
}
