import { useMutation } from "@tanstack/react-query";
import { fetchParagraphSuggestionPrompt } from "../../../api/chapters";

type UseParagraphSuggestionPromptRequestParams = {
  chapterId: string | null;
};

type PromptRequestArgs = {
  blockId: string;
  instructions: string;
};

export function useParagraphSuggestionPromptRequest({
  chapterId,
}: UseParagraphSuggestionPromptRequestParams) {
  const mutation = useMutation({
    mutationFn: async ({ blockId, instructions }: PromptRequestArgs) => {
      if (!chapterId) {
        throw new Error("Missing chapter identifier for prompt request");
      }

      return fetchParagraphSuggestionPrompt({
        chapterId,
        blockId,
        instructions: instructions.trim(),
      });
    },
  });

  return {
    requestPrompt: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
