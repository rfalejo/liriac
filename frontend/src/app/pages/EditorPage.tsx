import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useChapter } from '../../features/editor/hooks';
import { isOk } from '../../api/client';
import { useBottomBar } from '../../features/bottombar';
import { useTopBar } from '../../features/topbar';

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

  // Publish Bottom Bar contributions for Editor
  useEffect(() => {
    const title =
      chapterResult && isOk(chapterResult) && chapterResult.data.title
        ? ` — ${chapterResult.data.title}`
        : '';
    bar.set({
      left: `Book ${bookIdNum} — Chapter ${chapterIdNum}${title}`,
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
    top.set({
      breadcrumb: `Book: ${bookIdNum} › Chapter: ${chapterIdNum}${title ? ` — ${title}` : ''}`,
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex-shrink-0 p-4 border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
          <h1 className="text-xl font-semibold">Editor</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Book {bookIdNum} — Chapter {chapterIdNum}
          </p>
        </header>
        <main className="flex-1 p-4" aria-busy="true">
          <div className="w-full h-64 rounded-md bg-zinc-100/80 animate-pulse dark:bg-zinc-900/50" />
        </main>
      </div>
    );
  }

  // Error state
  if (error || (chapterResult && !isOk(chapterResult))) {
    const errorMessage =
      chapterResult && !isOk(chapterResult)
        ? chapterResult.error
        : 'Failed to load chapter';

    return (
      <div className="flex flex-col h-full">
        <header className="flex-shrink-0 p-4 border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
          <h1 className="text-xl font-semibold">Editor</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Book {bookIdNum} — Chapter {chapterIdNum}
          </p>
        </header>
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
      </div>
    );
  }

  const chapter = isOk(chapterResult!) ? chapterResult.data : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex-shrink-0 p-4 border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <h1 className="text-xl font-semibold">Editor</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Book {bookIdNum} — Chapter {chapterIdNum}
          {chapter?.title && ` — ${chapter.title}`}
        </p>
      </header>

      {/* Main editor area */}
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

      {/* Status moved to global Bottom Bar */}
    </div>
  );
}

export default EditorPage;
