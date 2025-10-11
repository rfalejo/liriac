import type { components } from "./schema";
import { request } from "./client";

export type LibraryResponse = components["schemas"]["LibraryResponse"];
export type ContextSection = components["schemas"]["ContextSection"];
export type ContextItem = components["schemas"]["ContextItem"];
export type LibraryBooksResponse = components["schemas"]["LibraryBooksResponse"];
export type LibraryBook = components["schemas"]["LibraryBook"];
export type ChapterSummary = components["schemas"]["ChapterSummary"];

export async function fetchLibrarySections(): Promise<LibraryResponse> {
  return request<LibraryResponse>("/api/library/");
}

export async function fetchLibraryBooks(): Promise<LibraryBooksResponse> {
  return request<LibraryBooksResponse>("/api/library/books/");
}
