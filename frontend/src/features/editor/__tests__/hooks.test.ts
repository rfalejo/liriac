import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import {
  renderHookWithProviders,
  mockApiResult,
  mockApiError,
} from '../../../test/utils';
import { useChapter } from '../hooks';
import * as endpoints from '../../../api/endpoints';

// Mock the endpoints module
vi.mock('../../../api/endpoints', () => ({
  getChapter: vi.fn(),
}));

const mockGetChapter = vi.mocked(endpoints.getChapter);

const mockChapterData = {
  id: 1,
  book: 1,
  title: 'Test Chapter',
  order: 1,
  body: 'This is the chapter content.',
  checksum: 'abc123',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('useChapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not fetch when chapterId is undefined', () => {
    const { result } = renderHookWithProviders(() => useChapter(undefined));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockGetChapter).not.toHaveBeenCalled();
  });

  it('should fetch chapter when chapterId is provided', async () => {
    mockGetChapter.mockResolvedValue({
      ...mockApiResult,
      data: mockChapterData,
    });

    const { result } = renderHookWithProviders(() => useChapter(1));

    expect(result.current.isLoading).toBe(true);
    expect(mockGetChapter).toHaveBeenCalledWith(1);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      ...mockApiResult,
      data: mockChapterData,
    });
    expect(result.current.error).toBeNull();
  });

  it('should handle API errors', async () => {
    mockGetChapter.mockResolvedValue(mockApiError);

    const { result } = renderHookWithProviders(() => useChapter(1));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockApiError);
    expect(result.current.error).toBeNull(); // React Query doesn't throw on API errors that return valid responses
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network error');
    mockGetChapter.mockRejectedValue(networkError);

    const { result } = renderHookWithProviders(() => useChapter(1));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(networkError);
    expect(result.current.data).toBeUndefined();
  });

  it('should refetch when chapterId changes', async () => {
    mockGetChapter
      .mockResolvedValueOnce({
        ...mockApiResult,
        data: { ...mockChapterData, id: 1 },
      })
      .mockResolvedValueOnce({
        ...mockApiResult,
        data: { ...mockChapterData, id: 2 },
      });

    let chapterId = 1;
    const { result, rerender } = renderHookWithProviders(() => useChapter(chapterId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetChapter).toHaveBeenCalledWith(1);

    // Change to chapter 2
    chapterId = 2;
    rerender();

    await waitFor(() => {
      expect(mockGetChapter).toHaveBeenCalledWith(2);
    });

    expect(mockGetChapter).toHaveBeenCalledTimes(2);
  });
});
