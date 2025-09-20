import type { Shortcut } from './types';

export function ShortcutKey({ keys, label, disabled }: Shortcut) {
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <kbd
        className={[
          'px-1.5 py-0.5 rounded border font-mono uppercase tracking-wide',
          'border-zinc-300 bg-zinc-100 text-zinc-800 shadow-sm',
          'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
          disabled ? 'opacity-50' : '',
        ].join(' ')}
        aria-disabled={disabled}
      >
        {keys}
      </kbd>
      {label ? <span className={disabled ? 'opacity-50' : ''}>{label}</span> : null}
    </span>
  );
}

export default ShortcutKey;
