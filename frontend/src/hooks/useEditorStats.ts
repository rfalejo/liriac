import { useEffect } from 'react';
import { mockTokenize } from '../utils/tokens';

export function useEditorStats(ref: React.RefObject<HTMLTextAreaElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tokens = mockTokenize(el.value || '');
    window.dispatchEvent(new CustomEvent('editor:stats', { detail: { tokens } }));
  }, [ref]);

  function update() {
    const el = ref.current;
    if (!el) return;
    const tokens = mockTokenize(el.value || '');
    window.dispatchEvent(new CustomEvent('editor:stats', { detail: { tokens } }));
  }

  return { update };
}
