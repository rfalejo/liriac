import type { components } from "./schema";
import { request } from "./client";

export type ChapterDetail = components["schemas"]["ChapterDetail"];
export type ChapterBlockUpdatePayload =
  components["schemas"]["PatchedChapterBlockUpdate"];
export type ChapterBlockCreatePayload =
  components["schemas"]["ChapterBlockCreate"];
export type ParagraphSuggestionResponse =
  components["schemas"]["ParagraphSuggestionResponse"];
export type ParagraphSuggestionPromptResponse =
  components["schemas"]["ParagraphSuggestionPromptResponse"];
export type ChapterContextVisibilityResponse =
  components["schemas"]["LibraryResponse"];
export type ChapterContextVisibilityUpdatePayload =
  components["schemas"]["PatchedChapterContextVisibilityUpdateRequest"];

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

type CreateChapterBlockParams = {
  chapterId: string;
  payload: ChapterBlockCreatePayload;
};

export async function createChapterBlock({
  chapterId,
  payload,
}: CreateChapterBlockParams): Promise<ChapterDetail> {
  const encodedChapter = encodeURIComponent(chapterId);

  return request<ChapterDetail>(
    `/api/library/chapters/${encodedChapter}/blocks/`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

type DeleteChapterBlockParams = {
  chapterId: string;
  blockId: string;
};

export async function deleteChapterBlock({
  chapterId,
  blockId,
}: DeleteChapterBlockParams): Promise<ChapterDetail> {
  const encodedChapter = encodeURIComponent(chapterId);
  const encodedBlock = encodeURIComponent(blockId);

  return request<ChapterDetail>(
    `/api/library/chapters/${encodedChapter}/blocks/${encodedBlock}/`,
    {
      method: "DELETE",
    },
  );
}

type ParagraphSuggestionParams = {
  chapterId: string;
  blockId: string;
  instructions: string;
};

export async function requestParagraphSuggestion({
  chapterId,
  blockId,
  instructions,
}: ParagraphSuggestionParams): Promise<ParagraphSuggestionResponse> {
  const encodedChapter = encodeURIComponent(chapterId);

  return request<ParagraphSuggestionResponse>(
    `/api/library/chapters/${encodedChapter}/paragraph-suggestion/`,
    {
      method: "POST",
      body: JSON.stringify({
        blockId,
        instructions,
      }),
    },
  );
}

type ParagraphSuggestionPromptParams = {
  chapterId: string;
  blockId: string;
  instructions: string;
};

export async function fetchParagraphSuggestionPrompt({
  chapterId,
  blockId,
  instructions,
}: ParagraphSuggestionPromptParams): Promise<ParagraphSuggestionPromptResponse> {
  const encodedChapter = encodeURIComponent(chapterId);
  const searchParams = new URLSearchParams();

  if (blockId) {
    searchParams.set("blockId", blockId);
  }

  if (instructions) {
    searchParams.set("instructions", instructions);
  }

  const query = searchParams.toString();
  const baseUrl = `/api/library/chapters/${encodedChapter}/paragraph-suggestion/prompt/`;
  const url = query ? `${baseUrl}?${query}` : baseUrl;

  return request<ParagraphSuggestionPromptResponse>(url);
}

export async function fetchChapterContextVisibility(
  chapterId: string,
): Promise<ChapterContextVisibilityResponse> {
  const encodedChapter = encodeURIComponent(chapterId);

  return request<ChapterContextVisibilityResponse>(
    `/api/library/chapters/${encodedChapter}/context-visibility/`,
  );
}

type UpdateChapterContextVisibilityParams = {
  chapterId: string;
  payload: ChapterContextVisibilityUpdatePayload;
};

export async function updateChapterContextVisibility({
  chapterId,
  payload,
}: UpdateChapterContextVisibilityParams): Promise<ChapterContextVisibilityResponse> {
  const encodedChapter = encodeURIComponent(chapterId);

  return request<ChapterContextVisibilityResponse>(
    `/api/library/chapters/${encodedChapter}/context-visibility/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}
