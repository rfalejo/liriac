import { useEffect } from 'react';
import EditorPage from './pages/EditorPage';
import { ThemeProvider } from './theme';

export default function App() {
  useEffect(() => {
    let idleTimer: number | undefined;

    const root = document.documentElement;
    const setIdle = (v: boolean) => root.setAttribute('data-idle', v ? 'true' : 'false');

    function kick() {
      setIdle(false);
      if (idleTimer) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => setIdle(true), 2000);
    }

    // Start in active state, then go idle after a bit
    kick();

    const onMove = () => kick();
    const onKey = (e: KeyboardEvent) => {
      // Treat modifier keys as activity too
      if (e.key) kick();
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('touchstart', onMove, { passive: true });
    window.addEventListener('keydown', onKey);

    return () => {
      if (idleTimer) window.clearTimeout(idleTimer);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('touchstart', onMove);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <ThemeProvider>
      <EditorPage />
    </ThemeProvider>
  );
}
