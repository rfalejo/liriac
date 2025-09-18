import { useQuery } from '@tanstack/react-query';
import { listBooks, listBookChapters, type ListParams } from '../../api/endpoints';

/**
 * React Query hook for fetching books with pagination and search.
 */
export function useBooks(params?: ListParams) {
  return useQuery({
    queryKey: ['books', params],
    queryFn: () => listBooks(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * React Query hook for fetching chapters for a specific book.
 * Only runs when bookId is provided.
 */
export function useBookChapters(bookId?: number, params?: ListParams) {
  return useQuery({
    queryKey: ['books', bookId, 'chapters', params],
    queryFn: () => listBookChapters(bookId!, params),
    enabled: bookId !== undefined,
    staleTime: 2 * 60 * 1000, // 2 minutes - chapters might change more frequently
  });
}
