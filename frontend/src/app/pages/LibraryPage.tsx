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
  const selectedBookId = bookIdParam ? parseInt(bookIdParam, 10) : undefined;

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    // Update URL with selected book ID
    const newParams = new URLSearchParams(searchParams);
    newParams.set('book', book.id.toString());
    setSearchParams(newParams);
  };

  // Clear selected book if URL param is removed
  useEffect(() => {
    if (!bookIdParam) {
      setSelectedBook(null);
    }
  }, [bookIdParam]);

  return (
    <section aria-labelledby="library-heading" className="h-full flex flex-col">
      <header className="mb-6">
        <h2 id="library-heading" className="text-2xl font-semibold">
          Library
        </h2>
        <p className="text-gray-600 mt-1">Manage your books and chapters</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Books panel */}
        <div className="flex flex-col min-h-0">
          <BooksList selectedBookId={selectedBookId} onBookSelect={handleBookSelect} />
        </div>

        {/* Chapters panel */}
        <div className="flex flex-col min-h-0">
          <ChaptersList bookId={selectedBookId} bookTitle={selectedBook?.title} />
        </div>
      </div>
    </section>
  );
}

export default LibraryPage;
