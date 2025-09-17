// Typed fetch wrapper for the liriac frontend.
// Uses the generated OpenAPI types for DTOs (see types.ts)

export type OkResult<T> = { ok: true; data: T; status: number; response: Response };
export type ErrResult = { ok: false; error: string; status: number; response: Response | null };
export type Result<T> = OkResult<T> | ErrResult;

const DEFAULT_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  Accept: 'application/json'
};

function getBaseUrl(): string {
  // Prefer explicitly configured base; fallback to relative root
  const base = (import.meta as any).env?.VITE_API_BASE || (globalThis as any).VITE_API_BASE || '/';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  json?: unknown; // convenience: provide an object to be JSON.stringified
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<Result<T>> {
  const base = getBaseUrl();
  const url = path.startsWith('http') ? path : `${base}${path}`;

  const { json, headers, ...rest } = options;
  let init: RequestInit = { ...rest, headers: { ...DEFAULT_HEADERS, ...(headers || {}) } };
  if (json !== undefined) {
    init = { ...init, body: JSON.stringify(json), method: init.method || 'POST' };
  }

  let response: Response | null = null;
  try {
    response = await fetch(url, init);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Network error';
    return { ok: false, error: message, status: 0, response: null };
  }

  let data: any = null;
  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      // ignore JSON parse errors; treat as text fallback
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  if (response.ok) {
    return { ok: true, data: data as T, status: response.status, response };
  }

  const error = typeof data === 'string' ? data : (data && (data.detail || data.error || JSON.stringify(data))) || response.statusText || 'Request failed';
  return { ok: false, error, status: response.status, response };
}

export function isOk<T>(result: Result<T>): result is OkResult<T> {
  return result.ok;
}
