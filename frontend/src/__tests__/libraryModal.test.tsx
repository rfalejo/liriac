import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LibraryBrowserModal from '../components/library/LibraryBrowserModal';

const sampleBooks = [
  {
    id: 'book-1',
    title: 'Book One',
    author: 'A. Author',
    synopsis: 'One line synopsis',
    chapters: [
      {
        id: 'ch-a',
        title: '01 — Arrival',
        summary: 'Reaching the city',
        ordinal: 1,
        tokens: 500,
        wordCount: 2000,
      },
      {
        id: 'ch-b',
        title: '02 — Bridges',
        summary: 'Walking across the plaza',
        ordinal: 2,
        tokens: 520,
        wordCount: 2100,
      },
    ],
  },
];

describe('LibraryBrowserModal', () => {
  it('renders books and allows selecting a chapter', () => {
    const onSelect = vi.fn();
    render(
      <LibraryBrowserModal
        open
        books={sampleBooks}
        activeChapterId={null}
        loadingChapterId={null}
        onClose={vi.fn()}
        onSelectChapter={onSelect}
      />,
    );

  expect(screen.getByText('Library explorer')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /book one/i })).toBeInTheDocument();
    expect(screen.getByText('01 — Arrival')).toBeInTheDocument();

  const openButtons = screen.getAllByRole('button', { name: /open chapter/i });
  fireEvent.click(openButtons[0]);
    expect(onSelect).toHaveBeenCalledWith(sampleBooks[0], sampleBooks[0].chapters[0]);
  });

  it('filters chapters by query', () => {
    render(
      <LibraryBrowserModal
        open
        books={sampleBooks}
        activeChapterId={null}
        loadingChapterId={null}
        onClose={vi.fn()}
        onSelectChapter={vi.fn()}
      />,
    );

    const search = screen.getByPlaceholderText('Search chapters…');
    fireEvent.change(search, { target: { value: 'bridges' } });

    expect(screen.queryByText('01 — Arrival')).not.toBeInTheDocument();
    expect(screen.getByText('02 — Bridges')).toBeInTheDocument();
  });
});
