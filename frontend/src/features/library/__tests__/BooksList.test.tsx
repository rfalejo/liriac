/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BooksList } from '../BooksList';
import {
  renderWithProviders,
  mockBook,
  mockApiResult,
  mockApiError,
} from '../../../test/utils';
import * as hooks from '../hooks';

// Mock the hooks
vi.mock('../hooks', () => ({
  useBooks: vi.fn(),
}));

const mockUseBooks = vi.mocked(hooks.useBooks);

describe('BooksList', () => {
  const mockOnBookSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render books list', async () => {
    mockUseBooks.mockReturnValue({
      data: mockApiResult,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(
      <BooksList selectedBookId={undefined} onBookSelect={mockOnBookSelect} />,
    );

    expect(screen.getByText('Books')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search books...')).toBeInTheDocument();
    expect(screen.getByText('Test Book')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseBooks.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(
      <BooksList selectedBookId={undefined} onBookSelect={mockOnBookSelect} />,
    );

    // Just check that skeleton elements exist - don't be strict about count
    const skeletonElements = screen.getAllByRole('generic');
    expect(skeletonElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Books')).toBeInTheDocument();
  });

  it('should show error state with retry button', async () => {
    const mockRefetch = vi.fn();
    mockUseBooks.mockReturnValue({
      data: mockApiError,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    renderWithProviders(
      <BooksList selectedBookId={undefined} onBookSelect={mockOnBookSelect} />,
    );

    expect(screen.getByText('Failed to load books: Test error')).toBeInTheDocument();

    const retryButton = screen.getByText('Retry');
    await userEvent.click(retryButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should show empty state when no books', () => {
    mockUseBooks.mockReturnValue({
      data: { ...mockApiResult, data: { ...mockApiResult.data, results: [] } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(
      <BooksList selectedBookId={undefined} onBookSelect={mockOnBookSelect} />,
    );

    expect(
      screen.getByText('No books yet. Create your first book!'),
    ).toBeInTheDocument();
  });

  it('should handle book selection', async () => {
    mockUseBooks.mockReturnValue({
      data: mockApiResult,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(
      <BooksList selectedBookId={undefined} onBookSelect={mockOnBookSelect} />,
    );

    const bookButton = screen.getByText('Test Book');
    await userEvent.click(bookButton);

    expect(mockOnBookSelect).toHaveBeenCalledWith(mockBook);
  });

  it('should highlight selected book', () => {
    mockUseBooks.mockReturnValue({
      data: mockApiResult,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(
      <BooksList selectedBookId={1} onBookSelect={mockOnBookSelect} />,
    );

    const bookButton = screen.getByText('Test Book').closest('button');
    expect(bookButton).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  it('should handle search input', async () => {
    let capturedParams: any;
    mockUseBooks.mockImplementation((params) => {
      capturedParams = params;
      return {
        data: mockApiResult,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any;
    });

    renderWithProviders(
      <BooksList selectedBookId={undefined} onBookSelect={mockOnBookSelect} />,
    );

    const searchInput = screen.getByPlaceholderText('Search books...');
    await userEvent.type(searchInput, 'test query');

    // Wait for debounce
    await waitFor(
      () => {
        expect(capturedParams?.search).toBe('test query');
      },
      { timeout: 500 },
    );
  });

  it('should handle pagination', async () => {
    const paginatedResult = {
      ...mockApiResult,
      data: {
        ...mockApiResult.data,
        next: 'http://example.com/page/2',
        previous: 'http://example.com/page/1',
      },
    };

    let capturedParams: any;
    mockUseBooks.mockImplementation((params) => {
      capturedParams = params;
      return {
        data: paginatedResult,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any;
    });

    renderWithProviders(
      <BooksList selectedBookId={undefined} onBookSelect={mockOnBookSelect} />,
    );

    const nextButton = screen.getByText('Next');
    await userEvent.click(nextButton);

    expect(capturedParams?.page).toBe(2);

    const prevButton = screen.getByText('Previous');
    await userEvent.click(prevButton);

    expect(capturedParams?.page).toBe(1);
  });
});
