import { request, isOk } from './client';
import type { components } from './types';

// Type aliases for clarity
export type Book = components['schemas']['Book'];
export type PaginatedBookList = components['schemas']['PaginatedBookList'];
export type ChapterList = components['schemas']['ChapterList'];
export type PaginatedChapterListList =
  components['schemas']['PaginatedChapterListList'];
export type ChapterDetail = components['schemas']['ChapterDetail'];
export type Persona = components['schemas']['Persona'];
export type PaginatedPersonaList = components['schemas']['PaginatedPersonaList'];

export interface ListParams {
  ordering?: string;
  page?: number;
  search?: string;
}

// Accept a narrow record; fallback to empty string for non-matching values
function buildQuery(
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (!entries.length) return '';
  const qs = new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
  return `?${qs}`;
}

// Books
export async function listBooks(params?: ListParams) {
  const q = params
    ? ({ ...params } as Record<string, string | number | boolean | null | undefined>)
    : undefined;
  return request<PaginatedBookList>(`/api/v1/books/${buildQuery(q)}`);
}

export async function getBook(id: number) {
  return request<Book>(`/api/v1/books/${id}/`, { method: 'GET' });
}

export interface CreateBookPayload {
  title: string;
  slug: string;
}
export async function createBook(payload: CreateBookPayload) {
  return request<Book>(`/api/v1/books/`, { json: payload, method: 'POST' });
}

export interface UpdateBookPayload {
  title?: string;
  slug?: string;
}
export async function updateBook(id: number, payload: UpdateBookPayload) {
  return request<Book>(`/api/v1/books/${id}/`, { json: payload, method: 'PATCH' });
}

// Chapters under a book (list for dashboard)
export async function listBookChapters(bookId: number, params?: ListParams) {
  const q = params
    ? ({ ...params } as Record<string, string | number | boolean | null | undefined>)
    : undefined;
  return request<PaginatedChapterListList>(
    `/api/v1/books/${bookId}/chapters/${buildQuery(q)}`,
  );
}

// Single chapter detail
export async function getChapter(id: number) {
  return request<ChapterDetail>(`/api/v1/chapters/${id}/`, { method: 'GET' });
}

// Chapter create/update
export interface CreateChapterPayload {
  title: string;
  order: number;
  body?: string;
  checksum: string;
}
export async function createChapter(bookId: number, payload: CreateChapterPayload) {
  return request<ChapterList>(`/api/v1/books/${bookId}/chapters/`, {
    json: payload,
    method: 'POST',
  });
}

export interface UpdateChapterPayload {
  title?: string;
  order?: number;
}
export async function updateChapter(id: number, payload: UpdateChapterPayload) {
  return request<ChapterDetail>(`/api/v1/chapters/${id}/`, {
    json: payload,
    method: 'PATCH',
  });
}

// Autosave
export interface AutosavePayload {
  body: string;
  checksum: string;
}
export interface AutosaveResponse {
  saved: boolean;
  checksum: string;
  saved_at: string;
}
export async function autosaveChapter(id: number, payload: AutosavePayload) {
  return request<AutosaveResponse>(`/api/v1/chapters/${id}/autosave/`, {
    json: payload,
    method: 'POST',
  });
}

// Personas
export async function listPersonas(params?: ListParams) {
  const q = params
    ? ({ ...params } as Record<string, string | number | boolean | null | undefined>)
    : undefined;
  return request<PaginatedPersonaList>(`/api/v1/personas/${buildQuery(q)}`);
}

export interface CreatePersonaPayload {
  name: string;
  role?: string;
  notes?: string;
}
export async function createPersona(payload: CreatePersonaPayload) {
  return request<Persona>(`/api/v1/personas/`, { json: payload, method: 'POST' });
}

// Health
export interface HealthResponse {
  status: string;
}
export async function health() {
  return request<HealthResponse>(`/api/v1/health/`, { method: 'GET' });
}

// Utility helper to unwrap or throw for quick scripts/components (optional usage)
export async function unwrap<T>(promise: ReturnType<typeof request<T>>): Promise<T> {
  const result = await promise;
  if (isOk(result)) return result.data;
  throw new Error(result.error);
}
