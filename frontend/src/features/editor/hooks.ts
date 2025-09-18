import { useQuery } from '@tanstack/react-query';
import { getChapter } from '../../api/endpoints';

/**
 * React Query hook for fetching a specific chapter.
 * Only runs when chapterId is provided.
 */
export function useChapter(chapterId?: number) {
  return useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: () => getChapter(chapterId!),
    enabled: chapterId !== undefined,
    staleTime: 30 * 1000, // 30 seconds - chapters might be edited frequently
  });
}
