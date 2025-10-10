import { useEffect } from 'react';
import TopAppBar from '../components/TopAppBar';
import EditorSurface from '../components/EditorSurface';
import FooterStatusBar from '../components/FooterStatusBar';
import Settings from '../components/Settings';
import { useAppStore } from '../store/appStore';
import { fetchEditor, fetchLibrary, type LibraryResponse } from '../api/client';
import type { ContextSection, ContextItem } from '../components/settings/ContextSectionList';

function normalizeSections(sections: LibraryResponse['sections'] = []): ContextSection[] {
  return sections.map((section) => {
    const items: ContextItem[] = section.items.map((item) => {
      const common = {
        id: item.id,
        tokens: item.tokens,
        checked: item.checked ?? false,
        disabled: item.disabled ?? false,
      } as const;

      switch (item.type) {
        case 'character':
          return {
            ...common,
            type: 'character' as const,
            name: item.name ?? '',
            role: item.role ?? undefined,
            summary: item.summary ?? undefined,
          };
        case 'world':
          return {
            ...common,
            type: 'world' as const,
            title: item.title ?? '',
            summary: item.summary ?? undefined,
            facts: item.facts ?? undefined,
          };
        case 'styleTone':
          return {
            ...common,
            type: 'styleTone' as const,
            description: item.description ?? '',
          };
        case 'chapter':
        default:
          return {
            ...common,
            type: 'chapter' as const,
            title: item.title ?? '',
          };
      }
    });

    return {
      id: section.id,
      title: section.title,
      defaultOpen: section.defaultOpen,
      items,
    } satisfies ContextSection;
  });
}

export default function EditorPage() {
  const tokens = useAppStore((s) => s.editor.tokens);
  const settingsOpen = useAppStore((s) => s.ui.settingsOpen);
  const openSettings = useAppStore((s) => s.ui.openSettings);
  const closeSettings = useAppStore((s) => s.ui.closeSettings);
  const setInitialContent = useAppStore((s) => s.editor.setInitialContent);
  const setTokens = useAppStore((s) => s.editor.setTokens);
  const setSections = useAppStore((s) => s.context.setSections);
  const showToast = useAppStore((s) => s.ui.showToast);

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

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [library, editor] = await Promise.all([fetchLibrary(), fetchEditor()]);
        if (cancelled) return;
        setSections(normalizeSections(library.sections));
        if (typeof editor.content === 'string') {
          setInitialContent(editor.content);
        }
        if (typeof editor.tokens === 'number') {
          setTokens(editor.tokens);
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load editor data', error);
        showToast('Unable to reach the local API. Data may be unavailable.');
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [setSections, setInitialContent, setTokens, showToast]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col">
      <TopAppBar />
      <EditorSurface disabled={settingsOpen} />
      <Settings open={settingsOpen} tokens={tokens} onClose={closeSettings} />
      <FooterStatusBar tokens={tokens} onOpenContext={openSettings} />
    </div>
  );
}
