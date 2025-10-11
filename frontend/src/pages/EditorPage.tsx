import { useEffect, useState } from 'react';
import TopAppBar from '../components/TopAppBar';
import EditorSurface from '../components/EditorSurface';
import FooterStatusBar from '../components/FooterStatusBar';
import Settings from '../components/Settings';
import { useAppStore } from '../store/appStore';
import {
  fetchEditor,
  fetchLibrary,
  fetchLibraryBooks,
  fetchChapterDetail,
  type LibraryResponse,
} from '../api/client';
import type { ContextSection, ContextItem } from '../components/settings/ContextSectionList';
import LibraryBrowserModal from '../components/library/LibraryBrowserModal';
import type { components } from '../api/schema';

type LibraryBook = components['schemas']['LibraryBook'];
type ChapterSummary = components['schemas']['ChapterSummary'];
type ChapterDetail = components['schemas']['ChapterDetail'];

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
  const libraryOpen = useAppStore((s) => s.ui.libraryOpen);
  const openLibrary = useAppStore((s) => s.ui.openLibrary);
  const closeLibrary = useAppStore((s) => s.ui.closeLibrary);
  const setInitialContent = useAppStore((s) => s.editor.setInitialContent);
  const setTokens = useAppStore((s) => s.editor.setTokens);
  const setSections = useAppStore((s) => s.context.setSections);
  const setLibraryBooks = useAppStore((s) => s.context.setLibraryBooks);
  const books = useAppStore((s) => s.context.books);
  const currentChapter = useAppStore((s) => s.editor.currentChapter);
  const setCurrentChapter = useAppStore((s) => s.editor.setCurrentChapter);
  const showToast = useAppStore((s) => s.ui.showToast);
  const [loadingChapterId, setLoadingChapterId] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ctrl/Cmd + , to open
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        openSettings();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        openLibrary();
        return;
      }
      // Esc to close when open
      if (e.key === 'Escape') {
        if (settingsOpen) {
          e.preventDefault();
          closeSettings();
          return;
        }
        if (libraryOpen) {
          e.preventDefault();
          closeLibrary();
        }
      }
    }
    window.addEventListener('keydown', onKeyDown as EventListener);
    return () => {
      window.removeEventListener('keydown', onKeyDown as EventListener);
    };
  }, [settingsOpen, libraryOpen, openSettings, closeSettings, openLibrary, closeLibrary]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [library, editor, libraryBooks] = await Promise.all([
          fetchLibrary(),
          fetchEditor(),
          fetchLibraryBooks(),
        ]);
        if (cancelled) return;
        setSections(normalizeSections(library.sections));
        setLibraryBooks(libraryBooks.books ?? []);
        if (typeof editor.content === 'string') {
          setInitialContent(editor.content);
        }
        if (typeof editor.tokens === 'number') {
          setTokens(editor.tokens);
        }
        setCurrentChapter({
          bookId: editor.bookId ?? null,
          bookTitle: editor.bookTitle ?? null,
          chapterId: editor.chapterId ?? null,
          chapterTitle: editor.chapterTitle ?? null,
        });
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
  }, [
    setSections,
    setLibraryBooks,
    setInitialContent,
    setTokens,
    setCurrentChapter,
    showToast,
  ]);

  async function handleChapterOpen(book: LibraryBook, chapter: ChapterSummary) {
    if (!chapter?.id) return;
    setLoadingChapterId(chapter.id);
    try {
      const detail: ChapterDetail = await fetchChapterDetail(chapter.id);
      if (typeof detail.content === 'string') {
        setInitialContent(detail.content);
      }
      const nextTokens =
        typeof detail.tokens === 'number'
          ? detail.tokens
          : typeof chapter.tokens === 'number'
            ? chapter.tokens
            : null;
      if (nextTokens !== null) {
        setTokens(nextTokens);
      }
      setCurrentChapter({
        bookId: (detail.bookId ?? book.id) ?? null,
        bookTitle: (detail.bookTitle ?? book.title) ?? null,
        chapterId: detail.id ?? chapter.id,
        chapterTitle: detail.title ?? chapter.title,
      });
      closeLibrary();
      showToast(`Opened ${detail.title ?? chapter.title}`);
    } catch (error) {
      console.error('Failed to open chapter', error);
      showToast('Unable to load that chapter right now.');
    } finally {
      setLoadingChapterId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col">
      <TopAppBar />
      <EditorSurface disabled={settingsOpen || libraryOpen} />
      <Settings open={settingsOpen} tokens={tokens} onClose={closeSettings} />
      <FooterStatusBar
        tokens={tokens}
        onOpenContext={openSettings}
        onOpenLibrary={openLibrary}
        libraryOpen={libraryOpen}
      />
      <LibraryBrowserModal
        open={libraryOpen}
        books={books}
        activeChapterId={currentChapter?.chapterId ?? null}
        loadingChapterId={loadingChapterId}
        onClose={closeLibrary}
        onSelectChapter={handleChapterOpen}
      />
    </div>
  );
}
