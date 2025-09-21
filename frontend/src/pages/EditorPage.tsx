import { useEffect, useState } from 'react';
import TopAppBar from '../components/TopAppBar';
import EditorSurface from '../components/EditorSurface';
import FooterStatusBar from '../components/FooterStatusBar';
import ContextEditor from '../components/ContextEditor';

export default function EditorPage() {
  const [tokens, setTokens] = useState(0);
  const [contextOpen, setContextOpen] = useState(false);

  useEffect(() => {
    function onStats(e: Event) {
      const ev = e as CustomEvent<{ tokens: number }>;
      if (typeof ev.detail?.tokens === 'number') {
        setTokens(ev.detail.tokens);
      }
    }
    function onOpenContext() {
      setContextOpen(true);
    }
    function onKeyDown(e: KeyboardEvent) {
      // Ctrl/Cmd + , to open
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setContextOpen(true);
      }
      // Esc to close when open
      if (e.key === 'Escape' && contextOpen) {
        setContextOpen(false);
      }
    }
    window.addEventListener('editor:stats', onStats as EventListener);
    window.addEventListener('context:open', onOpenContext as EventListener);
    window.addEventListener('keydown', onKeyDown as EventListener);
    return () => {
      window.removeEventListener('editor:stats', onStats as EventListener);
      window.removeEventListener('context:open', onOpenContext as EventListener);
      window.removeEventListener('keydown', onKeyDown as EventListener);
    };
  }, [contextOpen]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col">
      <TopAppBar />
      <EditorSurface />
      <ContextEditor open={contextOpen} tokens={tokens} onClose={() => setContextOpen(false)} />
      <FooterStatusBar tokens={tokens} onOpenContext={() => setContextOpen(true)} />
    </div>
  );
}
