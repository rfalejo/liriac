import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useChapter } from '../../features/editor/hooks';
import { isOk } from '../../api/client';
import { useBottomBar } from '../../features/bottombar';
import { useTopBar } from '../../features/topbar';
import { useQueryClient } from '@tanstack/react-query';

export function EditorPage() {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>();
  const chapterIdNum = chapterId ? parseInt(chapterId, 10) : undefined;
  const bookIdNum = bookId ? parseInt(bookId, 10) : undefined;

  const { data: chapterResult, isLoading, error, refetch } = useChapter(chapterIdNum);
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bar = useBottomBar();
  const top = useTopBar();

  // Update content when chapter data changes
  useEffect(() => {
    if (chapterResult && isOk(chapterResult)) {
      setContent(chapterResult.data.body || '');
    }
  }, [chapterResult]);

  const qc = useQueryClient();
  const navigate = useNavigate();

  // Publish Bottom Bar contributions for Editor
  useEffect(() => {
    const title =
      chapterResult && isOk(chapterResult) && chapterResult.data.title
        ? ` — ${chapterResult.data.title}`
        : '';
    bar.set({
      left:
        bookIdNum && chapterIdNum
          ? `Book ${bookIdNum} — Chapter ${chapterIdNum}${title}`
          : 'Editor',
      editor: {
        modeLabel: 'Mode: Manual',
        autosaveLabel: 'Autosave: active (every 10s)',
      },
      rightShortcuts: [
        { keys: 'Shift+Tab', label: 'Prompt', action: () => bar.togglePrompt() },
        { keys: 'Esc', label: 'Blur/Close' },
        { keys: 'Ctrl/Cmd+S', label: 'Save (disabled)', disabled: true },
      ],
    });

    return () => {
      bar.set({});
    };
  }, [bookIdNum, chapterIdNum, chapterResult, bar]);

  // Publish Top Bar contributions for Editor (breadcrumb, meta)
  useEffect(() => {
    const title =
      chapterResult && isOk(chapterResult) && chapterResult.data.title
        ? chapterResult.data.title
        : undefined;
    const breadcrumb =
      bookIdNum && chapterIdNum
        ? `Book: ${bookIdNum} › Chapter: ${chapterIdNum}${title ? ` — ${title}` : ''}`
        : 'Editor';
    top.set({
      breadcrumb,
      promptEnabled: true,
      quickActions: [
        { id: 'prompt', label: 'Prompt', onClick: () => bar.togglePrompt() },
      ],
      connectivity: { api: 'online', ws: 'connected', env: 'DEV' },
    });
    top.registerCommands([
      { id: 'action-prompt', title: 'Prompt', group: 'Actions', run: () => bar.togglePrompt() },
    ]);
  }, [bookIdNum, chapterIdNum, chapterResult, top, bar]);

  // Compute and patch doc meta based on content
  useEffect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const readingMinutes = words ? Math.max(1, Math.round(words / 200)) : 0;
    top.patch({ meta: { words, readingMinutes } });
  }, [content, top]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl/Cmd+S - prevent default save and show message
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        bar.pushMessage({ text: 'Save disabled (BL-014)' });
        return;
      }

      // Esc - blur textarea
      if (event.key === 'Escape') {
        textareaRef.current?.blur();
        return;
      }

      // Shift+Tab - open prompt popover
      if (event.key === 'Tab' && event.shiftKey) {
        event.preventDefault();
        bar.togglePrompt();
        return;
      }
    },
    [bar],
  );

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // Register navigation commands from cached chapter lists (palette-first)
  useEffect(() => {
    const entries = qc.getQueriesData({ queryKey: ['books'] });
    const commands: { id: string; title: string; group: string; run: () => void }[] = [];
    for (const [key, value] of entries as any[]) {
      if (!Array.isArray(key)) continue;
      if (key.length >= 4 && key[0] === 'books' && key[2] === 'chapters') {
        const bookIdFromKey = key[1] as number | undefined;
        const result = value as { ok: boolean; data?: { results?: Array<{ id: number; title: string }> } } | null;
        if (!bookIdFromKey || !result || !('ok' in result) || !result.ok) continue;
        const chapters = result.data?.results || [];
        for (const ch of chapters) {
          commands.push({
            id: `nav-chapter-${ch.id}`,
            title: `Open: ${ch.title} (Book ${bookIdFromKey})`,
            group: 'Navigate',
            run: () => navigate(`/books/${bookIdFromKey}/chapters/${ch.id}`),
          });
        }
      }
    }
    if (commands.length) top.registerCommands(commands);
    // Intentionally not depending on query cache reactive state; safe to run once and dedupe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, top, qc]);

  // Empty state: no chapter selected
  if (!bookIdNum || !chapterIdNum) {
    return (
      <main className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Editor</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Open the Command Palette (Cmd/Ctrl+K) to open a chapter.
          </p>
        </div>
      </main>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <main className="flex-1 p-4" aria-busy="true">
        <div className="w-full h-64 rounded-md bg-zinc-100/80 animate-pulse dark:bg-zinc-900/50" />
      </main>
    );
  }

  // Error state
  if (error || (chapterResult && !isOk(chapterResult))) {
    const errorMessage =
      chapterResult && !isOk(chapterResult)
        ? chapterResult.error
        : 'Failed to load chapter';

    return (
      <main
        className="flex-1 p-4 flex items-center justify-center"
        role="alert"
        aria-live="assertive"
      >
        <div className="text-center space-y-4 text-sm">
          <p className="text-red-600 dark:text-red-400">{errorMessage}</p>
          <button
            onClick={handleRetry}
            aria-label="Retry loading chapter"
            className="px-4 py-2 rounded border border-indigo-500/70 bg-indigo-600 text-white shadow-sm transition-colors hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 dark:border-indigo-400/70 dark:bg-indigo-500"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  // No local header; rely on Top/Bottom bars for context

  return (
    <main className="flex-1 p-4 overflow-hidden">
      <label htmlFor="chapter-editor" className="sr-only">
        Chapter content
      </label>
      <textarea
        ref={textareaRef}
        id="chapter-editor"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full h-full resize-none rounded-md border border-zinc-300 bg-white/95 p-4 font-mono leading-relaxed text-zinc-900 shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100"
        placeholder="Start writing your chapter..."
      />
    </main>
  );
}

export default EditorPage;
