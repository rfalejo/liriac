import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppLayout, LibraryPage, EditorPage, NotFoundPage } from './app/routes';

// For route assertions we construct a lightweight router with MemoryRouter,
// rather than mounting the full BrowserRouter from App (which would nest routers).
const renderWithRoute = (initial: string) => {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <AppLayout>
        <Routes>
          <Route path="/" element={<LibraryPage />} />
          <Route path="/books/:bookId/chapters/:chapterId" element={<EditorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
    </MemoryRouter>,
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
    expect(screen.getByText(/Book ID: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Chapter ID: 2/i)).toBeInTheDocument();
  });

  it('renders Not Found on unknown route', () => {
    renderWithRoute('/this-route-does-not-exist');
    expect(screen.getByRole('heading', { name: /not found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go back home/i })).toBeInTheDocument();
  });
});
