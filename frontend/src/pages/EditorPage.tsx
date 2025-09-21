import { useEffect } from 'react';
import TopAppBar from '../components/TopAppBar';
import EditorSurface from '../components/EditorSurface';
import FooterStatusBar from '../components/FooterStatusBar';
import Settings from '../components/Settings';
import { useAppStore } from '../store/appStore';

export default function EditorPage() {
  const { tokens, settingsOpen, openSettings, closeSettings } = useAppStore();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ctrl/Cmd + , to open
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        openSettings();
        return;
      }
      // Esc to close when open
      if (e.key === 'Escape' && settingsOpen) {
        e.preventDefault();
        closeSettings();
        return;
      }
    }
    window.addEventListener('keydown', onKeyDown as EventListener);
    return () => {
      window.removeEventListener('keydown', onKeyDown as EventListener);
    };
  }, [settingsOpen, openSettings, closeSettings]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col">
      <TopAppBar />
      <EditorSurface disabled={settingsOpen} />
      <Settings open={settingsOpen} tokens={tokens} onClose={closeSettings} />
      <FooterStatusBar tokens={tokens} onOpenContext={openSettings} />
    </div>
  );
}
