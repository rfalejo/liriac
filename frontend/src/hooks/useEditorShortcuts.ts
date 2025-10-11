import { typewriterScroll } from '../utils/caret';

export function useEditorShortcuts({
  textareaRef,
  openCommand,
  openLibrary,
  disabled,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  openCommand: (_initial?: string) => void;
  openLibrary?: () => void;
  disabled?: boolean;
}) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (disabled) return;

    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      openLibrary?.();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key === '.') {
      e.preventDefault();
      openCommand();
      return;
    }

    // Recenter caret after nav keys
    const navKeys = new Set([
      'ArrowUp',
      'ArrowDown',
      'PageUp',
      'PageDown',
      'Home',
      'End',
      'Enter',
    ]);
    if (navKeys.has(e.key)) {
      setTimeout(() => {
        const el = textareaRef.current;
        if (el) typewriterScroll(el);
      }, 0);
    }
  }

  return { handleKeyDown };
}
