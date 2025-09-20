import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout, LibraryPage, EditorPage, NotFoundPage } from './app/routes';

// Mock the library hooks to prevent actual API calls
vi.mock('./features/library/hooks', () => ({
  useBooks: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useBookChapters: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

// For route assertions we construct a lightweight router with MemoryRouter,
// rather than mounting the full BrowserRouter from App (which would nest routers).
const renderWithRoute = (initial: string) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initial]}>
        <AppLayout>
          <Routes>
            <Route path="/" element={<LibraryPage />} />
            <Route path="/books/:bookId/chapters/:chapterId" element={<EditorPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppLayout>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('App', () => {
  it('renders liriac header', () => {
    renderWithRoute('/');
    const heading = screen.getByRole('heading', { name: /liriac/i });
    expect(heading).toBeInTheDocument();
  });

  // Description text removed in new layout; not part of acceptance criteria.

  it('renders Library page on root route', () => {
    renderWithRoute('/');
    expect(screen.getByRole('heading', { name: /library/i })).toBeInTheDocument();
  });

  it('renders Editor page on editor route', () => {
    renderWithRoute('/books/1/chapters/2');
    expect(screen.getByRole('heading', { name: /editor/i })).toBeInTheDocument();
    // Text appears in both header and bottom bar; tolerate multiple matches
    const matches = screen.getAllByText(/Book 1 — Chapter 2/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Not Found on unknown route', () => {
    renderWithRoute('/this-route-does-not-exist');
    expect(screen.getByRole('heading', { name: /not found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go back home/i })).toBeInTheDocument();
  });
});
