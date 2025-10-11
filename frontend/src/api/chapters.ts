import type { components } from "./schema";
import { request } from "./client";

export type ChapterDetail = components["schemas"]["ChapterDetail"];

export async function fetchChapterDetail(
  chapterId: string,
): Promise<ChapterDetail> {
  const encodedId = encodeURIComponent(chapterId);
  return request<ChapterDetail>(`/api/library/chapters/${encodedId}/`);
}
