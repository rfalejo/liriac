import { useEffect } from 'react';
import { mockTokenize } from '../utils/tokens';
import { useAppStore } from '../store/appStore';

export function useEditorStats(ref: React.RefObject<HTMLTextAreaElement | null>) {
  const { setTokens } = useAppStore();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const updateTokens = () => {
      const tokens = mockTokenize(el.value || '');
      setTokens(tokens);
    };

    // Emit once on mount/open
    updateTokens();

    // Keep stats updated on every input change
    el.addEventListener('input', updateTokens);
    return () => {
      el.removeEventListener('input', updateTokens);
    };
  }, [ref, setTokens]);

  function update() {
    const el = ref.current;
    if (!el) return;
    const tokens = mockTokenize(el.value || '');
    setTokens(tokens);
  }

  return { update };
}
