import { useState, useEffect, useRef } from 'react';
import { useBooks } from './hooks';
import { isOk } from '../../api/client';
import type { Book } from '../../api/endpoints';

interface BooksListProps {
  selectedBookId?: number;
  // Prefixed parameter name with underscore to satisfy no-unused-vars lint rule for function type signatures
  onBookSelect: (_book: Book) => void;
  onBookPrefetch?: (_book: Book) => void;
}

export function BooksList({
  selectedBookId,
  onBookSelect,
  onBookPrefetch,
}: BooksListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const lastPrefetchedId = useRef<number | null>(null);

  const queryParams = {
    page: currentPage,
    // Search removed; palette-first navigation
    search: undefined,
    ordering: '-created_at', // Most recent first
  };

  const { data: result, isLoading, error, refetch } = useBooks(queryParams);
  const data = result && isOk(result) ? result.data : null;

  useEffect(() => {
    if (!selectedBookId || !data?.results) {
      lastPrefetchedId.current = selectedBookId ?? null;
      return;
    }

    if (lastPrefetchedId.current === selectedBookId) return;

    const matchingBook = data.results.find((book) => book.id === selectedBookId);
    if (matchingBook) {
      lastPrefetchedId.current = selectedBookId;
      onBookPrefetch?.(matchingBook);
    }
  }, [data, onBookPrefetch, selectedBookId]);

  // Inline search removed (BL-013C)

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

  if (error || (result && !isOk(result))) {
    const errorMessage =
      error?.message || (result && !isOk(result) ? result.error : 'Unknown error');
    return (
      <section className="space-y-4" aria-labelledby="books-panel" aria-live="polite">
        <h3 id="books-panel" className="text-lg font-medium">
          Books
        </h3>
        <div className="p-4 bg-red-100/80 border border-red-300 rounded-lg text-sm text-red-800 dark:bg-red-950/70 dark:border-red-900 dark:text-red-200">
          <p>Failed to load books: {errorMessage}</p>
          <button
            onClick={() => refetch()}
            aria-label="Retry loading books"
            className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 border border-red-300/70 text-xs font-medium uppercase tracking-wide text-red-800 hover:bg-red-200/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:border-red-700/70 dark:text-red-100 dark:hover:bg-red-900/60"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="books-panel" aria-busy={isLoading}>
      <h3 id="books-panel" className="text-lg font-medium">
        Books
      </h3>

      {isLoading && (
        <div className="space-y-2" role="status" aria-live="polite">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-3 border border-zinc-200 rounded-lg bg-white/60 animate-pulse dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <div className="h-4 bg-zinc-200 rounded w-3/4 dark:bg-zinc-800"></div>
              <div className="h-3 bg-zinc-200 rounded w-1/2 mt-2 dark:bg-zinc-800"></div>
            </div>
          ))}
        </div>
      )}

      {data && data.results.length === 0 && (
        <div className="p-4 text-center text-zinc-500 border border-zinc-200 rounded-lg bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
          No books yet. Create your first book!
        </div>
      )}

      {data && data.results.length > 0 && (
        <div className="space-y-2" role="list">
          {data.results.map((book) => (
            <button
              key={book.id}
              type="button"
              onClick={() => onBookSelect(book)}
              aria-current={selectedBookId === book.id ? 'true' : undefined}
              role="listitem"
              className={`w-full p-3 text-left border rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                selectedBookId === book.id
                  ? 'border-indigo-500 bg-indigo-100/80 text-zinc-900 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-zinc-50'
                  : 'border-zinc-200 bg-white/60 hover:bg-zinc-100/70 dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:bg-zinc-800/70'
              }`}
            >
              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                {book.title}
              </div>
              <div className="text-sm text-zinc-500 mt-1 dark:text-zinc-400">
                Created {new Date(book.created_at).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      )}

      {data && (data.previous || data.next) && (
        <div className="flex justify-between items-center pt-2 text-sm text-zinc-600 dark:text-zinc-400">
          <button
            onClick={handlePreviousPage}
            disabled={!data.previous}
            className="px-3 py-1 rounded border border-zinc-300 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Previous
          </button>
          <span className="font-mono uppercase text-xs tracking-wide">
            Page {currentPage}
          </span>
          <button
            onClick={handleNextPage}
            disabled={!data.next}
            className="px-3 py-1 rounded border border-zinc-300 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
