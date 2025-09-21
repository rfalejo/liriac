import { useEffect, useState } from 'react';
import TopAppBar from '../components/TopAppBar';
import EditorSurface from '../components/EditorSurface';
import FooterStatusBar from '../components/FooterStatusBar';

export default function EditorPage() {
  const [tokens, setTokens] = useState(0);

  useEffect(() => {
    function onStats(e: Event) {
      const ev = e as CustomEvent<{ tokens: number }>;
      if (typeof ev.detail?.tokens === 'number') {
        setTokens(ev.detail.tokens);
      }
    }
    window.addEventListener('editor:stats', onStats as EventListener);
    return () => window.removeEventListener('editor:stats', onStats as EventListener);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col">
      <TopAppBar />
      <EditorSurface />
      <FooterStatusBar tokens={tokens} />
    </div>
  );
}
