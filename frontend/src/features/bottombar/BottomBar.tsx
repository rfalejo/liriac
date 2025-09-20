import { useBottomBarState } from './context';
import ShortcutKey from './ShortcutKey';

export function BottomBar() {
  const { left, middle, rightShortcuts, editor, ephemeral } = useBottomBarState();

  // Compose middle slot: ephemeral messages take precedence
  let middleContent: string | undefined = ephemeral?.text || middle;
  if (editor?.streaming?.active) {
    const tokens = editor.streaming.tokens ?? 0;
    middleContent = `Generating… ${tokens} tokens`;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-0 inset-x-0 z-30 border-t border-zinc-200/70 bg-zinc-100/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-100/60 text-sm text-zinc-700 dark:text-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        {/* Left */}
        <div className="min-w-0 shrink text-ellipsis whitespace-nowrap overflow-hidden font-mono uppercase tracking-wide">
          {left || ''}
        </div>

        {/* Middle */}
        <div className="mx-4 min-w-0 flex-1 text-center text-zinc-600 dark:text-zinc-400 truncate">
          {editor?.modeLabel ? <span>{editor.modeLabel}</span> : null}
          {editor?.modeLabel && (middleContent || editor?.autosaveLabel) ? (
            <span className="mx-2">•</span>
          ) : null}
          {middleContent ? <span className="font-medium">{middleContent}</span> : null}
          {!middleContent && editor?.autosaveLabel ? (
            <span>{editor.autosaveLabel}</span>
          ) : null}
        </div>

        {/* Right shortcuts */}
        <div className="flex items-center gap-3">
          {(rightShortcuts || []).slice(0, 3).map((s, idx) => (
            <button
              key={`${s.keys}-${idx}`}
              type="button"
              className="text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-300"
              aria-label={s.ariaLabel || s.label || s.keys}
              onClick={s.action}
              disabled={s.disabled}
            >
              <ShortcutKey {...s} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BottomBar;
