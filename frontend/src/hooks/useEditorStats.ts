import { useEffect, useRef } from 'react';
import { mockTokenize } from '../utils/tokens';
import { useAppStore } from '../store/appStore';

export function useEditorStats(ref: React.RefObject<HTMLTextAreaElement | null>) {
  const setTokens = useAppStore((s) => s.editor.setTokens);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const updateTokens = () => {
      const tokens = mockTokenize(el.value || '');
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setTokens(tokens));
    };

    // Emit once on mount/open
    updateTokens();

    // Keep stats updated on every input change
    el.addEventListener('input', updateTokens);
    return () => {
      el.removeEventListener('input', updateTokens);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ref, setTokens]);

  function update() {
    const el = ref.current;
    if (!el) return;
    const tokens = mockTokenize(el.value || '');
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setTokens(tokens));
  }

  return { update };
}
