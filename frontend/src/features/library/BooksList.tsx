import { useState, useMemo } from 'react';
import { useBooks } from './hooks';
import { isOk } from '../../api/client';
import type { Book } from '../../api/endpoints';

interface BooksListProps {
  selectedBookId?: number;
  // Prefixed parameter name with underscore to satisfy no-unused-vars lint rule for function type signatures
  onBookSelect: (_book: Book) => void;
}

export function BooksList({ selectedBookId, onBookSelect }: BooksListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const queryParams = {
    page: currentPage,
    search: debouncedSearch || undefined,
    ordering: '-created_at', // Most recent first
  };

  const { data: result, isLoading, error, refetch } = useBooks(queryParams);
  const data = result && isOk(result) ? result.data : null;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
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

  if (error || (result && !isOk(result))) {
    const errorMessage =
      error?.message || (result && !isOk(result) ? result.error : 'Unknown error');
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Books</h3>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">Failed to load books: {errorMessage}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Books</h3>
        <div className="mt-2">
          <input
            type="text"
            placeholder="Search books..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {/* Loading skeleton */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-3 border border-gray-200 rounded-lg animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
            </div>
          ))}
        </div>
      )}

      {data && data.results.length === 0 && (
        <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-lg">
          {debouncedSearch
            ? 'No books found matching your search.'
            : 'No books yet. Create your first book!'}
        </div>
      )}

      {data && data.results.length > 0 && (
        <div className="space-y-2">
          {data.results.map((book) => (
            <button
              key={book.id}
              onClick={() => onBookSelect(book)}
              className={`w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors ${
                selectedBookId === book.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="font-medium text-gray-900">{book.title}</div>
              <div className="text-sm text-gray-500 mt-1">
                Created {new Date(book.created_at).toLocaleDateString()}
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
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {currentPage}</span>
          <button
            onClick={handleNextPage}
            disabled={!data.next}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
