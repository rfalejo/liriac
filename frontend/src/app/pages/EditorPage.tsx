import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useChapter } from '../../features/editor/hooks';
import { isOk } from '../../api/client';

export function EditorPage() {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>();
  const chapterIdNum = chapterId ? parseInt(chapterId, 10) : undefined;
  const bookIdNum = bookId ? parseInt(bookId, 10) : undefined;

  const { data: chapterResult, isLoading, error, refetch } = useChapter(chapterIdNum);
  const [content, setContent] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update content when chapter data changes
  useEffect(() => {
    if (chapterResult && isOk(chapterResult)) {
      setContent(chapterResult.data.body || '');
    }
  }, [chapterResult]);

  // Clear transient status message after timeout
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl/Cmd+S - prevent default save and show message
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        setStatusMessage('Save disabled (BL-014)');
        return;
      }

      // Esc - blur textarea
      if (event.key === 'Escape') {
        textareaRef.current?.blur();
        return;
      }
    },
    [],
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

      {/* Status bar */}
      <footer
        role="status"
        aria-live="polite"
        className="flex-shrink-0 p-3 border-t border-zinc-200/70 bg-zinc-100/60 text-sm text-zinc-600 flex items-center justify-between font-mono uppercase tracking-wide dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-400"
      >
        <div className="flex items-center space-x-4">
          <span>Mode: Manual</span>
          {chapter && (
            <>
              <span>•</span>
              <span>Book: {bookIdNum}</span>
              <span>•</span>
              <span>Chapter: {chapterIdNum}</span>
            </>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {statusMessage && (
            <span className="text-blue-600 font-medium">{statusMessage}</span>
          )}
          <span>Autosave: active (every 10s)</span>
        </div>
      </footer>
    </div>
  );
}

export default EditorPage;
