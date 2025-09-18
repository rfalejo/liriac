import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { useBooks, useBookChapters } from '../hooks';
import {
  renderHookWithProviders,
  mockApiResult,
  mockPaginatedChapters,
} from '../../../test/utils';
import * as endpoints from '../../../api/endpoints';

// Mock the API endpoints
vi.mock('../../../api/endpoints', () => ({
  listBooks: vi.fn(),
  listBookChapters: vi.fn(),
}));

const mockListBooks = vi.mocked(endpoints.listBooks);
const mockListBookChapters = vi.mocked(endpoints.listBookChapters);

describe('Library hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useBooks', () => {
    it('should fetch books successfully', async () => {
      mockListBooks.mockResolvedValue(mockApiResult);

      const { result } = renderHookWithProviders(() => useBooks());

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockListBooks).toHaveBeenCalledWith(undefined);
      expect(result.current.data).toEqual(mockApiResult);
    });

    it('should fetch books with params', async () => {
      mockListBooks.mockResolvedValue(mockApiResult);
      const params = { page: 2, search: 'test' };

      const { result } = renderHookWithProviders(() => useBooks(params));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockListBooks).toHaveBeenCalledWith(params);
    });

    it('should handle errors', async () => {
      mockListBooks.mockRejectedValue(new Error('Network error'));

      const { result } = renderHookWithProviders(() => useBooks());

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('useBookChapters', () => {
    it('should fetch chapters when bookId is provided', async () => {
      const chaptersResult = { ...mockApiResult, data: mockPaginatedChapters };
      mockListBookChapters.mockResolvedValue(chaptersResult);

      const { result } = renderHookWithProviders(() => useBookChapters(1));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockListBookChapters).toHaveBeenCalledWith(1, undefined);
      expect(result.current.data).toEqual(chaptersResult);
    });

    it('should not fetch when bookId is undefined', () => {
      const { result } = renderHookWithProviders(() => useBookChapters(undefined));

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockListBookChapters).not.toHaveBeenCalled();
    });

    it('should fetch chapters with params', async () => {
      const chaptersResult = { ...mockApiResult, data: mockPaginatedChapters };
      mockListBookChapters.mockResolvedValue(chaptersResult);
      const params = { page: 2, ordering: 'order' };

      const { result } = renderHookWithProviders(() => useBookChapters(1, params));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockListBookChapters).toHaveBeenCalledWith(1, params);
    });

    it('should handle errors', async () => {
      mockListBookChapters.mockRejectedValue(new Error('Network error'));

      const { result } = renderHookWithProviders(() => useBookChapters(1));

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });
});
