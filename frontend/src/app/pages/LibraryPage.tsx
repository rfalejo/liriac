import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BooksList } from '../../features/library/BooksList';
import { ChaptersList } from '../../features/library/ChaptersList';
import type { Book } from '../../api/endpoints';
import BookDialog from '../../features/library/components/BookDialog';
import { useQueryClient } from '@tanstack/react-query';
import { useBottomBar } from '../../features/bottombar';

export function LibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const qc = useQueryClient();
  const bar = useBottomBar();

  // Get selected book ID from URL params
  const bookIdParam = searchParams.get('book');
  const parsedBookId = bookIdParam ? Number.parseInt(bookIdParam, 10) : NaN;
  const selectedBookId = Number.isFinite(parsedBookId) ? parsedBookId : undefined;

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    // Update URL with selected book ID
    const newParams = new URLSearchParams(searchParams);
    if (newParams.get('book') !== book.id.toString()) {
      newParams.set('book', book.id.toString());
      setSearchParams(newParams);
    }
  };

  // Clear selected book if URL param is removed
  useEffect(() => {
    // Publish Bottom Bar contributions for Library
    bar.set({
      left: 'Library',
      middle: 'Manage your books and chapters',
      rightShortcuts: [
        { keys: '?', label: 'Shortcuts' },
        { keys: '/', label: 'Search' },
        {
          keys: 'N',
          label: 'New book',
          action: () => setCreateOpen(true),
        },
      ],
    });

    return () => {
      // Reset to defaults when leaving the page
      bar.set({});
    };
  }, [bar]);

  useEffect(() => {
    if (!bookIdParam) {
      setSelectedBook(null);
    }
  }, [bookIdParam]);

  useEffect(() => {
    if (selectedBookId === undefined) {
      setSelectedBook(null);
      return;
    }

    setSelectedBook((current) => {
      if (current?.id === selectedBookId) {
        return current;
      }
      return null;
    });
  }, [selectedBookId]);

  return (
    <section aria-labelledby="library-heading" className="h-full flex flex-col gap-6">
      <header className="space-y-2">
        <h2 id="library-heading" className="text-2xl font-semibold tracking-tight">
          Library
        </h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Manage your books and chapters with a command-line inspired interface.
          </p>
          <div className="flex gap-2">
            {selectedBook && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="px-3 py-1.5 rounded border border-zinc-300 text-sm hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Edit Book
              </button>
            )}
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              New Book
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Books panel */}
        <div className="flex flex-col min-h-0 rounded-xl border border-zinc-200/70 bg-white/50 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <BooksList
            selectedBookId={selectedBookId}
            onBookSelect={handleBookSelect}
            onBookPrefetch={(book) => {
              setSelectedBook((prev) => (prev?.id === book.id ? prev : book));
            }}
          />
        </div>

        {/* Chapters panel */}
        <div className="flex flex-col min-h-0 rounded-xl border border-zinc-200/70 bg-white/50 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <ChaptersList bookId={selectedBookId} bookTitle={selectedBook?.title} />
        </div>
      </div>

      {/* Create dialog */}
      <BookDialog
        mode="create"
        isOpen={isCreateOpen}
        initial={null}
        onClose={() => setCreateOpen(false)}
        onSuccess={(book) => {
          // Invalidate book lists and select the created book
          qc.invalidateQueries({ queryKey: ['books'] }).then(() => {
            handleBookSelect(book);
          });
        }}
      />

      {/* Edit dialog */}
      <BookDialog
        mode="edit"
        isOpen={isEditOpen}
        initial={selectedBook}
        onClose={() => setEditOpen(false)}
        onSuccess={(book) => {
          // Update selection and refresh caches
          setSelectedBook(book);
          const params = new URLSearchParams(searchParams);
          params.set('book', String(book.id));
          setSearchParams(params);
          qc.invalidateQueries({ queryKey: ['books'] });
        }}
      />
    </section>
  );
}

export default LibraryPage;
