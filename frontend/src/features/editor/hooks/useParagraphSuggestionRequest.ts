import { useMutation } from "@tanstack/react-query";
import { requestParagraphSuggestion } from "../../../api/chapters";

type UseParagraphSuggestionRequestParams = {
  chapterId: string | null;
};

type RequestArgs = {
  blockId: string;
  instructions: string;
};

export function useParagraphSuggestionRequest({
  chapterId,
}: UseParagraphSuggestionRequestParams) {
  const mutation = useMutation({
    mutationFn: async ({ blockId, instructions }: RequestArgs) => {
      if (!chapterId) {
        throw new Error("Missing chapter identifier for suggestion request");
      }

      return requestParagraphSuggestion({
        chapterId,
        blockId,
        instructions,
      });
    },
  });

  return {
    requestSuggestion: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
