/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChaptersList } from '../ChaptersList';
import { renderWithProviders, mockApiResult } from '../../../test/utils';
import * as hooks from '../hooks';
import * as endpoints from '../../../api/endpoints';

vi.mock('../hooks', () => ({ useBookChapters: vi.fn() }));
const mockUseBookChapters = vi.mocked(hooks.useBookChapters);

vi.mock('../../../api/endpoints', async () => {
  const actual = await vi.importActual<typeof import('../../../api/endpoints')>(
    '../../../api/endpoints',
  );
  return { ...actual, reorderBookChapters: vi.fn() };
});
const reorderBookChapters = vi.mocked(endpoints.reorderBookChapters);

describe('Chapters reorder UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('moves items locally and commits reorder', async () => {
    const chapters = [
      { id: 1, title: 'One', order: 1, updated_at: new Date().toISOString() },
      { id: 2, title: 'Two', order: 2, updated_at: new Date().toISOString() },
      { id: 3, title: 'Three', order: 3, updated_at: new Date().toISOString() },
    ];
    mockUseBookChapters.mockReturnValue({
      data: {
        ...mockApiResult,
        data: { count: 3, next: null, previous: null, results: chapters },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    reorderBookChapters.mockResolvedValue({
      ok: true,
      data: [
        { ...chapters[1], order: 1 },
        { ...chapters[0], order: 2 },
        { ...chapters[2], order: 3 },
      ],
      status: 200,
      response: {} as any,
    });

    renderWithProviders(<ChaptersList bookId={1} bookTitle="Test" />);

    // Click move down on first row (or move up on second)
    const btnDown = screen.getByRole('button', { name: 'Move One down' });
    await userEvent.click(btnDown);

    // Commit
    const saveBtn = screen.getByRole('button', { name: 'Save order' });
    await userEvent.click(saveBtn);

    expect(reorderBookChapters).toHaveBeenCalledWith(1, { ordered_ids: [2, 1, 3] });
  });
});
