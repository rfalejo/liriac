/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChapterDialog from '../components/ChapterDialog';
import { renderWithProviders } from '../../../test/utils';
import * as endpoints from '../../../api/endpoints';

vi.mock('../../../api/endpoints', () => ({
  createChapter: vi.fn(),
  updateChapter: vi.fn(),
}));

const createChapter = vi.mocked(endpoints.createChapter);
const updateChapter = vi.mocked(endpoints.updateChapter);

describe('ChapterDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a chapter with computed checksum', async () => {
    createChapter.mockResolvedValue({
      ok: true,
      data: { id: 10, title: 'Intro', order: 1, updated_at: new Date().toISOString() },
      status: 201,
      response: {} as any,
    });
    const onSuccess = vi.fn();

    renderWithProviders(
      <ChapterDialog
        mode="create"
        bookId={42}
        initial={null}
        isOpen={true}
        onClose={() => {}}
        onSuccess={onSuccess}
      />,
    );

    await userEvent.type(screen.getByLabelText('Title'), 'Intro');
    await userEvent.clear(screen.getByLabelText('Order'));
    await userEvent.type(screen.getByLabelText('Order'), '1');
    await userEvent.type(screen.getByLabelText('Body (optional)'), 'Hello');

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(createChapter).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith({ id: 10, title: 'Intro', order: 1 });
  });

  it('edits a chapter title and order', async () => {
    updateChapter.mockResolvedValue({
      ok: true,
      data: {
        id: 5,
        book: 1,
        title: 'Revised',
        order: 2,
        body: '',
        checksum: '0'.repeat(64),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      status: 200,
      response: {} as any,
    });

    const onSuccess = vi.fn();

    renderWithProviders(
      <ChapterDialog
        mode="edit"
        initial={{ id: 5, title: 'Old', order: 1 }}
        isOpen={true}
        onClose={() => {}}
        onSuccess={onSuccess}
      />,
    );

    await userEvent.clear(screen.getByLabelText('Title'));
    await userEvent.type(screen.getByLabelText('Title'), 'Revised');
    await userEvent.clear(screen.getByLabelText('Order'));
    await userEvent.type(screen.getByLabelText('Order'), '2');

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(updateChapter).toHaveBeenCalledWith(5, { title: 'Revised', order: 2 });
    expect(onSuccess).toHaveBeenCalledWith({ id: 5, title: 'Revised', order: 2 });
  });
});
