import { getSceneOffsets, jumpToOffset } from '../utils/scenes';
import { typewriterScroll } from '../utils/caret';

function atLineStart(el: HTMLTextAreaElement) {
  const pos = el.selectionStart ?? 0;
  if (pos === 0) return true;
  return el.value[pos - 1] === '\n';
}

export function useEditorShortcuts({
  textareaRef,
  openCommand,
  disabled,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  openCommand: () => void;
  disabled?: boolean;
}) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (disabled) return;

    // Open command palette
    if ((e.metaKey || e.ctrlKey) && e.key === '.') {
      e.preventDefault();
      openCommand();
      return;
    }
    if ((e.key === '>' || e.key === '/') && !e.shiftKey) {
      const el = e.currentTarget as HTMLTextAreaElement;
      if (atLineStart(el)) {
        e.preventDefault();
        openCommand();
        return;
      }
    }

    // Scene navigation
    if ((e.metaKey || e.ctrlKey) && e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      const el = e.currentTarget as HTMLTextAreaElement;
      const pos = el.selectionStart ?? 0;
      const offs = getSceneOffsets(el.value);
      let idx = 0;
      for (let i = 0; i < offs.length; i++) {
        if (offs[i] <= pos) idx = i;
        else break;
      }
      const nextIdx = e.key === 'ArrowLeft' ? Math.max(0, idx - 1) : Math.min(offs.length - 1, idx + 1);
      jumpToOffset(el, offs[nextIdx]);
      setTimeout(() => typewriterScroll(el), 0);
      return;
    }

    // Recenter caret after nav keys
    const navKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Enter']);
    if (navKeys.has(e.key)) {
      setTimeout(() => {
        const el = textareaRef.current;
        if (el) typewriterScroll(el);
      }, 0);
    }
  }

  return { handleKeyDown };
}
