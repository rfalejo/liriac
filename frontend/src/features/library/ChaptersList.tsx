import { useState } from 'react';
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
  const navigate = useNavigate();

  const queryParams = {
    page: currentPage,
    ordering: 'order', // Order by the 'order' field
  };

  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useBookChapters(bookId, queryParams);
  const data = result && isOk(result) ? result.data : null;

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
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Chapters</h3>
        <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-lg">
          Select a book to view its chapters
        </div>
      </div>
    );
  }

  if (error || (result && !isOk(result))) {
    const errorMessage =
      error?.message || (result && !isOk(result) ? result.error : 'Unknown error');
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          Chapters
          {bookTitle && (
            <span className="text-gray-500 font-normal"> — {bookTitle}</span>
          )}
        </h3>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">
            Failed to load chapters: {errorMessage}
          </p>
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
      <h3 className="text-lg font-medium">
        Chapters
        {bookTitle && <span className="text-gray-500 font-normal"> — {bookTitle}</span>}
      </h3>

      {isLoading && (
        <div className="space-y-2">
          {/* Loading skeleton */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-3 border border-gray-200 rounded-lg animate-pulse"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {data && data.results.length === 0 && (
        <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-lg">
          No chapters yet. Create your first chapter!
        </div>
      )}

      {data && data.results.length > 0 && (
        <div className="space-y-2">
          {data.results.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => handleChapterClick(chapter)}
              className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-1">
                <div className="font-medium text-gray-900">{chapter.title}</div>
                <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  #{chapter.order}
                </div>
              </div>
              <div className="text-sm text-gray-500">
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
