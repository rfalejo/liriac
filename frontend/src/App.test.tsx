import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout, EditorPage, NotFoundPage } from './app/routes';

// No library hooks needed for editor-only root route

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
            <Route path="/" element={<EditorPage />} />
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

  it('renders Editor empty state on root route', () => {
    renderWithRoute('/');
    expect(screen.getByRole('heading', { name: /editor/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Open the Command Palette \(Cmd\/Ctrl\+K\) to open a chapter\./i),
    ).toBeInTheDocument();
  });

  it('renders Editor page on editor route', () => {
    renderWithRoute('/books/1/chapters/2');
    // In editor layout, Top/Bottom bars show context; no local header
    const matches = screen.getAllByText(/Book 1 — Chapter 2/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Not Found on unknown route', () => {
    renderWithRoute('/this-route-does-not-exist');
    expect(screen.getByRole('heading', { name: /not found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go back home/i })).toBeInTheDocument();
  });
});
