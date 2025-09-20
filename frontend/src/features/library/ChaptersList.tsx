import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookChapters } from './hooks';
import { isOk } from '../../api/client';
import type { ChapterList } from '../../api/endpoints';

interface ChaptersListProps {
  bookId?: number;
  bookTitle?: string;
}

export function ChaptersList({ bookId, bookTitle }: ChaptersListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const previousBookIdRef = useRef<number | undefined>(bookId);
  const navigate = useNavigate();

  const bookChanged = bookId !== previousBookIdRef.current;
  const pageForQuery = bookChanged ? 1 : currentPage;

  const queryParams = {
    page: pageForQuery,
    ordering: 'order', // Order by the 'order' field
  };

  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useBookChapters(bookId, queryParams);
  const data = result && isOk(result) ? result.data : null;

  useEffect(() => {
    if (bookChanged) {
      setCurrentPage(1);
      previousBookIdRef.current = bookId;
    }
  }, [bookChanged, bookId]);

  const handleChapterClick = (chapter: ChapterList) => {
    if (bookId) {
      navigate(`/books/${bookId}/chapters/${chapter.id}`);
    }
  };

  const handlePreviousPage = () => {
    if (data?.previous) {
      setCurrentPage((prev) => Math.max(1, prev - 1));
    }
  };

  const handleNextPage = () => {
    if (data?.next) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  if (!bookId) {
    return (
      <section className="space-y-4" aria-labelledby="chapters-panel">
        <h3 id="chapters-panel" className="text-lg font-medium">
          Chapters
        </h3>
        <div className="p-4 text-center text-zinc-500 border border-zinc-200 rounded-lg bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
          Select a book to view its chapters
        </div>
      </section>
    );
  }

  if (error || (result && !isOk(result))) {
    const errorMessage =
      error?.message || (result && !isOk(result) ? result.error : 'Unknown error');
    return (
      <section
        className="space-y-4"
        aria-labelledby="chapters-panel"
        aria-live="polite"
      >
        <h3 id="chapters-panel" className="text-lg font-medium">
          Chapters
          {bookTitle && (
            <span className="text-zinc-500 font-normal"> — {bookTitle}</span>
          )}
        </h3>
        <div className="p-4 text-sm bg-red-100/80 border border-red-300 rounded-lg text-red-800 dark:bg-red-950/70 dark:border-red-900 dark:text-red-200">
          <p>Failed to load chapters: {errorMessage}</p>
          <button
            onClick={() => refetch()}
            aria-label="Retry loading chapters"
            className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 border border-red-300/70 text-xs font-medium uppercase tracking-wide text-red-800 hover:bg-red-200/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:border-red-700/70 dark:text-red-100 dark:hover:bg-red-900/60"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="space-y-4"
      aria-labelledby="chapters-panel"
      aria-busy={isLoading}
    >
      <h3 id="chapters-panel" className="text-lg font-medium">
        Chapters
        {bookTitle && <span className="text-zinc-500 font-normal"> — {bookTitle}</span>}
      </h3>

      {isLoading && (
        <div className="space-y-2" role="status" aria-live="polite">
          {/* Loading skeleton */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-3 border border-zinc-200 rounded-lg bg-white/60 animate-pulse dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="h-4 bg-zinc-200 rounded w-3/4 dark:bg-zinc-800"></div>
                <div className="h-3 bg-zinc-200 rounded w-12 dark:bg-zinc-800"></div>
              </div>
              <div className="h-3 bg-zinc-200 rounded w-1/2 dark:bg-zinc-800"></div>
            </div>
          ))}
        </div>
      )}

      {data && data.results.length === 0 && (
        <div className="p-4 text-center text-zinc-500 border border-zinc-200 rounded-lg bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
          No chapters yet. Create your first chapter!
        </div>
      )}

      {data && data.results.length > 0 && (
        <div className="space-y-2">
          {data.results.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => handleChapterClick(chapter)}
              className="w-full p-3 text-left border border-zinc-200 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 hover:bg-zinc-100 hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:bg-zinc-800/70 dark:hover:border-indigo-400"
            >
              <div className="flex justify-between items-start mb-1">
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  {chapter.title}
                </div>
                <div className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded dark:bg-zinc-800 dark:text-zinc-300">
                  #{chapter.order}
                </div>
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                Last updated {new Date(chapter.updated_at).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && (data.previous || data.next) && (
        <div className="flex justify-between items-center pt-2">
          <button
            onClick={handlePreviousPage}
            disabled={!data.previous}
            className="px-3 py-1 text-sm rounded border border-zinc-300 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-500 font-mono uppercase tracking-wide dark:text-zinc-400">
            Page {currentPage}
          </span>
          <button
            onClick={handleNextPage}
            disabled={!data.next}
            className="px-3 py-1 text-sm rounded border border-zinc-300 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
