import { useCommandPalette } from '../hooks/useCommandPalette';
import { type CommandLike } from '../commands/commandUtils';

export type Command = {
  id: string;
  label: string;
  hint?: string;
  aliases?: string[];
};

export type CommandBarProps = {
  open: boolean;
  value: string;
  onChange: (_v: string) => void;
  onClose: () => void;
  onExecute: (_cmd: Command, _input: string) => void;
  commands: Command[];
};

export default function CommandBar({
  open,
  value,
  onChange,
  onClose,
  onExecute,
  commands,
}: CommandBarProps) {
  const { inputRef, completionTail, onInputChange, handleKeyDown } = useCommandPalette({
    open,
    value,
    onChange,
    onClose,
    // Cast is safe: Command satisfies CommandLike
    onExecute: onExecute as (_cmd: CommandLike, _input: string) => void,
    commands,
  });

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2">
      <div className="pointer-events-auto overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)]/95 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="select-none text-[var(--muted)]">{'>'}</span>
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command…"
              className="w-full bg-transparent py-1 text-sm text-[var(--fg)] outline-none placeholder:text-[var(--muted)]"
              aria-label="Command input"
            />
            {completionTail && (
              <div className="pointer-events-none absolute inset-0 flex items-center">
                <span className="invisible">{value}</span>
                <span className="text-[var(--muted)] opacity-50">{completionTail}</span>
              </div>
            )}
          </div>
          <span
            className={`hidden sm:inline text-[10px] text-[var(--muted)] ml-2 ${completionTail ? 'opacity-60' : 'opacity-0'}`}
          >
            Tab to autocomplete
          </span>
          <kbd className="hidden sm:inline rounded border border-[var(--border)] bg-black/20 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
            Esc
          </kbd>
        </div>
      </div>
    </div>
  );
}
