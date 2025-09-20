import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BooksList } from '../../features/library/BooksList';
import { ChaptersList } from '../../features/library/ChaptersList';
import type { Book } from '../../api/endpoints';

export function LibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

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
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Manage your books and chapters with a command-line inspired interface.
        </p>
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
    </section>
  );
}

export default LibraryPage;
