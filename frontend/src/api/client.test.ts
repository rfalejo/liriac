import { afterEach, describe, expect, it, vi } from 'vitest';
import { request, isOk } from './client';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('request()', () => {
  it('returns ok result on 200 JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({ hello: 'world' }),
    });

    const res = await request<{ hello: string }>('/api/v1/health/', { method: 'GET' });
    expect(isOk(res)).toBe(true);
    if (isOk(res)) {
      expect(res.data.hello).toBe('world');
      expect(res.status).toBe(200);
    }
  });

  it('returns error result on non-2xx with JSON detail', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({ detail: 'Invalid payload' }),
    });

    const res = await request('/api/v1/chapters/1/autosave/', {
      method: 'POST',
      json: { body: '', checksum: '' },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain('Invalid payload');
      expect(res.status).toBe(400);
    }
  });

  it('returns network error on fetch throw', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const res = await request('/api/v1/health/', { method: 'GET' });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain('ECONNREFUSED');
      expect(res.status).toBe(0);
    }
  });
});
