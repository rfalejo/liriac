import type { components } from "./schema";
import { request } from "./client";

export type ChapterDetail = components["schemas"]["ChapterDetail"];
export type ChapterBlockUpdatePayload =
  components["schemas"]["PatchedChapterBlockUpdate"];

export async function fetchChapterDetail(
  chapterId: string,
): Promise<ChapterDetail> {
  const encodedId = encodeURIComponent(chapterId);
  return request<ChapterDetail>(`/api/library/chapters/${encodedId}/`);
}

type UpdateChapterBlockParams = {
  chapterId: string;
  blockId: string;
  payload: ChapterBlockUpdatePayload;
};

export async function updateChapterBlock({
  chapterId,
  blockId,
  payload,
}: UpdateChapterBlockParams): Promise<ChapterDetail> {
  const encodedChapter = encodeURIComponent(chapterId);
  const encodedBlock = encodeURIComponent(blockId);

  return request<ChapterDetail>(
    `/api/library/chapters/${encodedChapter}/blocks/${encodedBlock}/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}
