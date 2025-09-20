/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LibraryPage } from '../pages/LibraryPage';
import {
  renderWithProviders,
  mockApiResult,
  mockPaginatedChapters,
} from '../../test/utils';
import * as hooks from '../../features/library/hooks';

// Mock the hooks
vi.mock('../../features/library/hooks', () => ({
  useBooks: vi.fn(),
  useBookChapters: vi.fn(),
}));

const mockUseBooks = vi.mocked(hooks.useBooks);
const mockUseBookChapters = vi.mocked(hooks.useBookChapters);

describe('LibraryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseBooks.mockReturnValue({
      data: mockApiResult,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    mockUseBookChapters.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
  });

  it('should render library page with heading and both panels', () => {
    renderWithProviders(<LibraryPage />);

    expect(screen.getAllByText('Library').length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Manage your books and chapters with a command-line/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
    expect(screen.getByText('Chapters')).toBeInTheDocument();
    // Use a regex matcher to be resilient to future wording tweaks or element splits
    expect(screen.getByText(/select a book to view its chapters/i)).toBeInTheDocument();
  });

  it('should handle book selection and show chapters', async () => {
    const chaptersResult = { ...mockApiResult, data: mockPaginatedChapters };

    // Mock chapters loading after book selection
    mockUseBookChapters.mockImplementation((bookId: number | undefined) => {
      if (bookId === 1) {
        return {
          data: chaptersResult,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        } as any;
      }
      return {
        data: null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any;
    });

    renderWithProviders(<LibraryPage />);

    // Select a book
    const bookButton = screen.getByText('Test Book');
    await userEvent.click(bookButton);

    // Wait for chapters to load
    await waitFor(() => {
      expect(screen.getByText('Chapters')).toBeInTheDocument();
      expect(screen.getByText('Test Book')).toBeInTheDocument(); // Book title in chapters header
      expect(screen.getByText('Test Chapter')).toBeInTheDocument();
    });
  });

  it('should derive selection from URL parameter and highlight the book', async () => {
    const chaptersResult = { ...mockApiResult, data: mockPaginatedChapters };

    mockUseBookChapters.mockReturnValue({
      data: chaptersResult,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(<LibraryPage />, { initialEntries: ['/?book=1'] });

    expect(mockUseBookChapters).toHaveBeenCalledWith(1, expect.any(Object));

    await waitFor(() => {
      expect(screen.getByText('— Test Book')).toBeInTheDocument();
    });

    const highlightedBook = screen.getByText('Test Book').closest('button');
    expect(highlightedBook).toHaveAttribute('aria-current', 'true');
  });

  it('should show empty states when there are no books', async () => {
    // Mock empty books list
    mockUseBooks.mockReturnValue({
      data: { ...mockApiResult, data: { ...mockApiResult.data, results: [] } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    mockUseBookChapters.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(<LibraryPage />, { initialEntries: ['/'] });

    // Should show empty books state message
    expect(
      screen.getByText('No books yet. Create your first book!'),
    ).toBeInTheDocument();
    // Chapters hook should be invoked with undefined book id (disabled query)
    expect(mockUseBookChapters).toHaveBeenCalledWith(undefined, expect.any(Object));
  });

  it('should use responsive grid layout', () => {
    const { container } = renderWithProviders(<LibraryPage />);

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-2');
  });
});
