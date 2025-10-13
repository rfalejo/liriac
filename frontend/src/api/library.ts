import type { components } from "./schema";
import { request } from "./client";

export type LibraryResponse = components["schemas"]["LibraryResponse"];
export type ContextSection = components["schemas"]["ContextSection"];
export type ContextItem = components["schemas"]["ContextItem"];
export type LibraryBooksResponse =
  components["schemas"]["LibraryBooksResponse"];
export type LibraryBook = components["schemas"]["LibraryBook"];
export type ChapterSummary = components["schemas"]["ChapterSummary"];
export type BookUpsert = components["schemas"]["BookUpsert"];
export type PatchedBookUpsert = components["schemas"]["PatchedBookUpsert"];
export type ChapterUpsert = components["schemas"]["ChapterUpsert"];
export type PatchedChapterUpsert =
  components["schemas"]["PatchedChapterUpsert"];

export async function fetchLibrarySections(): Promise<LibraryResponse> {
  return request<LibraryResponse>("/api/library/");
}

export async function fetchLibraryBooks(): Promise<LibraryBooksResponse> {
  return request<LibraryBooksResponse>("/api/library/books/");
}

export async function createLibraryBook(
  payload: BookUpsert,
): Promise<LibraryBook> {
  return request<LibraryBook>("/api/library/books/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateLibraryBook(
  bookId: string,
  payload: PatchedBookUpsert,
): Promise<LibraryBook> {
  return request<LibraryBook>(`/api/library/books/${bookId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteLibraryBook(bookId: string): Promise<void> {
  await request(`/api/library/books/${bookId}/`, {
    method: "DELETE",
    parseJson: false,
  });
}

export async function createLibraryChapter(
  bookId: string,
  payload: ChapterUpsert,
): Promise<ChapterSummary> {
  return request<ChapterSummary>(`/api/library/books/${bookId}/chapters/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateLibraryChapter(
  chapterId: string,
  payload: PatchedChapterUpsert,
): Promise<ChapterSummary> {
  return request<ChapterSummary>(`/api/library/chapters/${chapterId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
