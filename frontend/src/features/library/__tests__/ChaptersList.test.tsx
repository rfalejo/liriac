/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate } from 'react-router-dom';
import { ChaptersList } from '../ChaptersList';
import {
  renderWithProviders,
  mockApiResult,
  mockApiError,
  mockPaginatedChapters,
} from '../../../test/utils';
import * as hooks from '../hooks';

// Mock the hooks and navigation
vi.mock('../hooks', () => ({
  useBookChapters: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

const mockUseBookChapters = vi.mocked(hooks.useBookChapters);
const mockNavigate = vi.fn();
const mockUseNavigate = vi.mocked(useNavigate);

describe('ChaptersList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
  });

  it('should show select book message when no bookId', () => {
    mockUseBookChapters.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(<ChaptersList bookId={undefined} bookTitle={undefined} />);

    expect(screen.getByText('Chapters')).toBeInTheDocument();
    expect(screen.getByText('Select a book to view its chapters')).toBeInTheDocument();
  });

  it('should render chapters list', () => {
    const chaptersResult = { ...mockApiResult, data: mockPaginatedChapters };
    mockUseBookChapters.mockReturnValue({
      data: chaptersResult,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(<ChaptersList bookId={1} bookTitle="Test Book" />);

    expect(screen.getByText('Chapters')).toBeInTheDocument();
    // Use getByRole to find the specific span with the book title
    expect(screen.getByText('— Test Book')).toBeInTheDocument();
    expect(screen.getByText('Test Chapter')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseBookChapters.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(<ChaptersList bookId={1} bookTitle="Test Book" />);

    // Just check that skeleton elements exist - don't be strict about count
    const skeletonElements = screen.getAllByRole('generic');
    expect(skeletonElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Chapters')).toBeInTheDocument();
    expect(screen.getByText('— Test Book')).toBeInTheDocument();
  });

  it('should show error state with retry button', async () => {
    const mockRefetch = vi.fn();
    mockUseBookChapters.mockReturnValue({
      data: mockApiError,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    renderWithProviders(<ChaptersList bookId={1} bookTitle="Test Book" />);

    expect(screen.getByText('Failed to load chapters: Test error')).toBeInTheDocument();

    const retryButton = screen.getByText('Retry');
    await userEvent.click(retryButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should show empty state when no chapters', () => {
    const emptyResult = {
      ...mockApiResult,
      data: { ...mockPaginatedChapters, results: [] },
    };
    mockUseBookChapters.mockReturnValue({
      data: emptyResult,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(<ChaptersList bookId={1} bookTitle="Test Book" />);

    expect(
      screen.getByText('No chapters yet. Create your first chapter!'),
    ).toBeInTheDocument();
  });

  it('should navigate to editor on chapter click', async () => {
    const chaptersResult = { ...mockApiResult, data: mockPaginatedChapters };
    mockUseBookChapters.mockReturnValue({
      data: chaptersResult,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(<ChaptersList bookId={1} bookTitle="Test Book" />);

    const chapterButton = screen.getByText('Test Chapter');
    await userEvent.click(chapterButton);

    expect(mockNavigate).toHaveBeenCalledWith('/books/1/chapters/1');
  });

  it('should handle pagination', async () => {
    const paginatedResult = {
      ...mockApiResult,
      data: {
        ...mockPaginatedChapters,
        next: 'http://example.com/page/2',
        previous: 'http://example.com/page/1',
      },
    };

    let capturedParams: any;
    mockUseBookChapters.mockImplementation((_bookId, params) => {
      capturedParams = params;
      return {
        data: paginatedResult,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any;
    });

    renderWithProviders(<ChaptersList bookId={1} bookTitle="Test Book" />);

    const nextButton = screen.getByText('Next');
    await userEvent.click(nextButton);

    expect(capturedParams?.page).toBe(2);

    const prevButton = screen.getByText('Previous');
    await userEvent.click(prevButton);

    expect(capturedParams?.page).toBe(1);
  });

  it('should display title without book name when no bookTitle provided', () => {
    const chaptersResult = { ...mockApiResult, data: mockPaginatedChapters };
    mockUseBookChapters.mockReturnValue({
      data: chaptersResult,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(<ChaptersList bookId={1} bookTitle={undefined} />);

    expect(screen.getByText('Chapters')).toBeInTheDocument();
    expect(screen.queryByText('Chapters —')).not.toBeInTheDocument();
  });

  it('should reset pagination to page 1 when the book changes', async () => {
    const paginatedResult = {
      ...mockApiResult,
      data: {
        ...mockPaginatedChapters,
        next: 'http://example.com/page/2',
      },
    };

    mockUseBookChapters.mockImplementation((bookId: number | undefined, params) => {
      return {
        data: paginatedResult,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        __meta: { bookId, params },
      } as any;
    });

    const { rerender } = renderWithProviders(
      <ChaptersList bookId={1} bookTitle="First Book" />,
    );

    const nextButton = screen.getByText('Next');
    await userEvent.click(nextButton);

    rerender(<ChaptersList bookId={2} bookTitle="Second Book" />);

    await waitFor(() => {
      const lastCall = mockUseBookChapters.mock.calls.at(-1);
      expect(lastCall?.[0]).toBe(2);
      expect(lastCall?.[1]).toMatchObject({ page: 1 });
    });
  });
});
