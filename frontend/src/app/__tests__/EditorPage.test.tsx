/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProviders, mockApiResult, mockApiError } from '../../test/utils';
import EditorPage from '../pages/EditorPage';
import * as editorHooks from '../../features/editor/hooks';

// Mock the useChapter hook
vi.mock('../../features/editor/hooks', () => ({
  useChapter: vi.fn(),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

import { useParams } from 'react-router-dom';

const mockUseParams = vi.mocked(useParams);
const mockUseChapter = vi.mocked(editorHooks.useChapter);

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

describe('EditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ bookId: '1', chapterId: '2' });
  });

  it('should render loading state', () => {
    mockUseChapter.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(
      <TestProviders>
        <EditorPage />
      </TestProviders>,
    );

    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Book 1 — Chapter 2')).toBeInTheDocument();
    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('main').querySelector('.animate-pulse'),
    );
  });

  it('should render error state with retry button', async () => {
    const mockRefetch = vi.fn();
    mockUseChapter.mockReturnValue({
      data: mockApiError,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(
      <TestProviders>
        <EditorPage />
      </TestProviders>,
    );

    expect(screen.getByText('Test error')).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: 'Retry loading chapter' });
    expect(retryButton).toBeInTheDocument();

    await userEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalledOnce();
  });

  it('should render loaded chapter content', () => {
    mockUseChapter.mockReturnValue({
      data: {
        ...mockApiResult,
        data: mockChapterData,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(
      <TestProviders>
        <EditorPage />
      </TestProviders>,
    );

    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Book 1 — Chapter 2 — Test Chapter')).toBeInTheDocument();

    const textarea = screen.getByRole('textbox', { name: 'Chapter content' });
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('This is the chapter content.');

    expect(screen.getByText('Mode: Manual')).toBeInTheDocument();
    expect(screen.getByText('Autosave: active (every 10s)')).toBeInTheDocument();
  });

  it('should handle text editing', async () => {
    const user = userEvent.setup();
    mockUseChapter.mockReturnValue({
      data: {
        ...mockApiResult,
        data: mockChapterData,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(
      <TestProviders>
        <EditorPage />
      </TestProviders>,
    );

    const textarea = screen.getByRole('textbox', { name: 'Chapter content' });

    await user.clear(textarea);
    await user.type(textarea, 'New chapter content');

    expect(textarea).toHaveValue('New chapter content');
  });

  it('should handle Ctrl+S keyboard shortcut', async () => {
    const user = userEvent.setup();
    mockUseChapter.mockReturnValue({
      data: {
        ...mockApiResult,
        data: mockChapterData,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(
      <TestProviders>
        <EditorPage />
      </TestProviders>,
    );

    const textarea = screen.getByRole('textbox', { name: 'Chapter content' });
    await user.click(textarea);

    // Simulate Ctrl+S
    await user.keyboard('{Control>}s{/Control}');

    expect(screen.getByText('Save disabled (BL-014)')).toBeInTheDocument();

    // Message should disappear after timeout
    await waitFor(
      () => {
        expect(screen.queryByText('Save disabled (BL-014)')).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('should handle Cmd+S keyboard shortcut on Mac', async () => {
    const user = userEvent.setup();
    mockUseChapter.mockReturnValue({
      data: {
        ...mockApiResult,
        data: mockChapterData,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(
      <TestProviders>
        <EditorPage />
      </TestProviders>,
    );

    const textarea = screen.getByRole('textbox', { name: 'Chapter content' });
    await user.click(textarea);

    // Simulate Cmd+S
    await user.keyboard('{Meta>}s{/Meta}');

    expect(screen.getByText('Save disabled (BL-014)')).toBeInTheDocument();
  });

  it('should handle Escape keyboard shortcut', async () => {
    const user = userEvent.setup();
    mockUseChapter.mockReturnValue({
      data: {
        ...mockApiResult,
        data: mockChapterData,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(
      <TestProviders>
        <EditorPage />
      </TestProviders>,
    );

    const textarea = screen.getByRole('textbox', { name: 'Chapter content' });
    await user.click(textarea);

    expect(textarea).toHaveFocus();

    // Simulate Escape
    await user.keyboard('{Escape}');

    expect(textarea).not.toHaveFocus();
  });

  it('should handle network error state', () => {
    const mockRefetch = vi.fn();
    mockUseChapter.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
    } as any);

    render(
      <TestProviders>
        <EditorPage />
      </TestProviders>,
    );

    expect(screen.getByText('Failed to load chapter')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Retry loading chapter' }),
    ).toBeInTheDocument();
  });

  it('should update content when chapter changes', () => {
    const { rerender } = render(
      <TestProviders>
        <EditorPage />
      </TestProviders>,
    );

    // First chapter
    mockUseChapter.mockReturnValue({
      data: {
        ...mockApiResult,
        data: mockChapterData,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    rerender(
      <TestProviders>
        <EditorPage />
      </TestProviders>,
    );

    expect(screen.getByRole('textbox')).toHaveValue('This is the chapter content.');

    // Second chapter with different content
    const differentChapter = {
      ...mockChapterData,
      id: 3,
      body: 'Different chapter content.',
    };

    mockUseChapter.mockReturnValue({
      data: {
        ...mockApiResult,
        data: differentChapter,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    rerender(
      <TestProviders>
        <EditorPage />
      </TestProviders>,
    );

    expect(screen.getByRole('textbox')).toHaveValue('Different chapter content.');
  });
});
