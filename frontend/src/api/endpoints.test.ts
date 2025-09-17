import { describe, it, expect, vi, afterEach } from 'vitest';
import { listBooks } from './endpoints';
import type { PaginatedBookList } from './endpoints';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('endpoints', () => {
  it('listBooks returns paginated list', async () => {
    const payload: PaginatedBookList = {
      count: 1,
      next: null,
      previous: null,
      results: [
        { id: 1, title: 'Test Book', slug: 'test-book', created_at: new Date().toISOString(), last_opened: null }
      ]
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => payload
    });

    const res = await listBooks();
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.results[0].title).toBe('Test Book');
    }
  });
});
