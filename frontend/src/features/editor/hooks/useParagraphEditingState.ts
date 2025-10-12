import { useCallback } from "react";
import type { ChapterBlock } from "../types";
import {
  createBlockEditingState,
  type BlockEditingParams,
  type BlockEditingSideEffects,
} from "./editing/createBlockEditingState";

export type ParagraphEditingSideEffects = BlockEditingSideEffects;

type ParagraphBlock = ChapterBlock & { type: "paragraph" };

type UseParagraphEditingStateParams = BlockEditingParams<ParagraphBlock>;

type ParagraphEditingHandlers = {
  draftText: string;
  onChangeDraft: (value: string) => void;
  hasPendingChanges: boolean;
  save: () => Promise<boolean>;
};

const useParagraphBlockEditingState = createBlockEditingState<
  ParagraphBlock,
  string
>({
  deriveDraft: (block) => block?.text ?? "",
  hasChanges: ({ block, draft }) => draft !== (block.text ?? ""),
  buildPayload: (draft) => ({ text: draft }),
});

export function useParagraphEditingState(
  params: UseParagraphEditingStateParams,
): ParagraphEditingHandlers {
  const { draft, setDraft, hasPendingChanges, save } =
    useParagraphBlockEditingState(params);
  const { isActive } = params;

  const onChangeDraft = useCallback(
    (value: string) => {
      if (!isActive) {
        return;
      }
      setDraft(value);
    },
    [isActive, setDraft],
  );

  return {
    draftText: draft,
    hasPendingChanges,
    onChangeDraft,
    save,
  };
}
