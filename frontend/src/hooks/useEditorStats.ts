import { useEffect } from 'react';
import { mockTokenize } from '../utils/tokens';

export function useEditorStats(ref: React.RefObject<HTMLTextAreaElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const emit = () => {
      const tokens = mockTokenize(el.value || '');
      window.dispatchEvent(new CustomEvent('editor:stats', { detail: { tokens } }));
    };

    // Emit once on mount/open
    emit();

    // Keep stats updated on every input change
    el.addEventListener('input', emit);
    return () => {
      el.removeEventListener('input', emit);
    };
  }, [ref]);

  function update() {
    const el = ref.current;
    if (!el) return;
    const tokens = mockTokenize(el.value || '');
    window.dispatchEvent(new CustomEvent('editor:stats', { detail: { tokens } }));
  }

  return { update };
}
