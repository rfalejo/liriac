import type { components } from './schema';

const DEFAULT_BASE_URL = 'http://localhost:8000';

const API_BASE = (import.meta.env.VITE_API_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');

function buildUrl(path: string): string {
  if (!path.startsWith('/')) {
    return `${API_BASE}/${path}`;
  }
  return `${API_BASE}${path}`;
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(buildUrl(path), {
    headers: {
      Accept: 'application/json',
    },
    credentials: 'same-origin',
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type');
    let message = `${res.status} ${res.statusText}`;
    if (contentType?.includes('application/json')) {
      try {
        const payload = await res.json();
        message = payload.detail ?? message;
      } catch {
        // ignore json parse error
      }
    }
    throw new Error(`Request to ${path} failed: ${message}`);
  }

  return res.json() as Promise<T>;
}

export type LibraryResponse = components['schemas']['LibraryResponse'];
export type EditorState = components['schemas']['EditorState'];

export function fetchLibrary(): Promise<LibraryResponse> {
  return request<LibraryResponse>('/api/library/');
}

export function fetchEditor(): Promise<EditorState> {
  return request<EditorState>('/api/editor/');
}
