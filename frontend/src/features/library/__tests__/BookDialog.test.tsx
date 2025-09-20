/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookDialog from '../components/BookDialog';
import { renderWithProviders, mockBook } from '../../../test/utils';
import * as endpoints from '../../../api/endpoints';

vi.mock('../../../api/endpoints', () => ({
  createBook: vi.fn(),
  updateBook: vi.fn(),
}));

const createBook = vi.mocked(endpoints.createBook);
const updateBook = vi.mocked(endpoints.updateBook);

describe('BookDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a book with generated slug', async () => {
    createBook.mockResolvedValue({
      ok: true,
      data: mockBook,
      status: 201,
      response: {} as any,
    });
    const onSuccess = vi.fn();

    renderWithProviders(
      <BookDialog
        mode="create"
        initial={null}
        isOpen={true}
        onClose={() => {}}
        onSuccess={onSuccess}
      />,
    );

    const titleInput = screen.getByLabelText('Title');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'New Test Book');

    const slugInput = screen.getByLabelText('Slug');
    expect(slugInput).toHaveValue('new-test-book');

    const submitBtn = screen.getByRole('button', { name: 'Create' });
    await userEvent.click(submitBtn);

    expect(createBook).toHaveBeenCalledWith({
      title: 'New Test Book',
      slug: 'new-test-book',
    });
    expect(onSuccess).toHaveBeenCalledWith(mockBook);
  });

  it('edits a book and calls update', async () => {
    updateBook.mockResolvedValue({
      ok: true,
      data: mockBook,
      status: 200,
      response: {} as any,
    });
    const onSuccess = vi.fn();

    renderWithProviders(
      <BookDialog
        mode="edit"
        initial={{ id: 1, title: 'Old', slug: 'old' }}
        isOpen={true}
        onClose={() => {}}
        onSuccess={onSuccess}
      />,
    );

    const titleInput = screen.getByLabelText('Title');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Updated');

    const saveBtn = screen.getByRole('button', { name: 'Save' });
    await userEvent.click(saveBtn);

    expect(updateBook).toHaveBeenCalledWith(1, { title: 'Updated', slug: 'updated' });
    expect(onSuccess).toHaveBeenCalled();
  });
});
