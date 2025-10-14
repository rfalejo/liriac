import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ChapterBlock,
  ParagraphSuggestionState,
} from "../../types";
import type { EditorEditingSideEffects } from "./types";
import { useParagraphEditingState } from "../useParagraphEditingState";
import { useParagraphSuggestionRequest } from "../useParagraphSuggestionRequest";

type ParagraphBlock = ChapterBlock & { type: "paragraph" };

export type ParagraphBlockEditingSessionParams = {
  block: ParagraphBlock | null;
  isActive: boolean;
  isSaving: boolean;
  chapterId: string | null;
  updateBlock: Parameters<typeof useParagraphEditingState>[0]["updateBlock"];
  onComplete: Parameters<typeof useParagraphEditingState>[0]["onComplete"];
  sideEffects: Pick<EditorEditingSideEffects, "notifyUpdateFailure">;
};

export type ParagraphBlockEditingSession = {
  blockId: string | null;
  isEditing: boolean;
  draftText: string;
  onChangeDraft: (value: string) => void;
  hasPendingChanges: boolean;
  save: () => Promise<boolean>;
  suggestion: ParagraphSuggestionState;
  openSuggestionPrompt: () => void;
  closeSuggestionPrompt: () => void;
  isSuggestionPending: boolean;
};

type SuggestionResult = {
  instructions: string;
  text: string;
};

type ParagraphSuggestionControllerParams = {
  block: ParagraphBlock | null;
  isActive: boolean;
  draftText: string;
  onChangeDraft: (value: string) => void;
  chapterId: string | null;
  notifyUpdateFailure: (error: unknown) => void;
};

function useParagraphSuggestionController({
  block,
  isActive,
  draftText,
  onChangeDraft,
  chapterId,
  notifyUpdateFailure,
}: ParagraphSuggestionControllerParams) {
  const { requestSuggestion, isPending } = useParagraphSuggestionRequest({
    chapterId,
  });

  const [promptOpen, setPromptOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [result, setResult] = useState<SuggestionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openPrompt = useCallback(() => {
    if (!block || !isActive) {
      return;
    }
    setPromptOpen(true);
    setError(null);
  }, [block, isActive]);

  const closePrompt = useCallback(() => {
    if (isPending) {
      return;
    }
    setPromptOpen(false);
    setInstructions("");
    setError(null);
  }, [isPending]);

  const handleSubmit = useCallback(async () => {
    if (!block || !isActive) {
      return;
    }

    const trimmed = instructions.trim();
    if (!trimmed) {
      setError("Añade instrucciones para generar la sugerencia.");
      return;
    }

    try {
      const response = await requestSuggestion({
        blockId: block.id,
        instructions: trimmed,
      });

      setResult({
        instructions: trimmed,
        text: response.paragraphSuggestion,
      });
      setPromptOpen(false);
      setInstructions("");
      setError(null);
    } catch (suggestionError) {
      setError("No pudimos generar la sugerencia. Inténtalo de nuevo.");
      notifyUpdateFailure(suggestionError);
    }
  }, [block, instructions, isActive, notifyUpdateFailure, requestSuggestion]);

  const handleDismissResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const handleApplyResult = useCallback(() => {
    if (!result) {
      return;
    }

    const suggestionContent = result.text.trim();
    if (suggestionContent.length === 0) {
      setResult(null);
      setError(null);
      return;
    }

    const currentValue = draftText;
    const hasDoubleBreak = /\n\n$/.test(currentValue);
    const hasSingleBreak = /\n$/.test(currentValue);

    let nextValue = currentValue;

    if (currentValue.length === 0) {
      nextValue = suggestionContent;
    } else if (hasDoubleBreak) {
      nextValue = `${currentValue}${suggestionContent}`;
    } else if (hasSingleBreak) {
      nextValue = `${currentValue}\n${suggestionContent}`;
    } else {
      nextValue = `${currentValue}\n\n${suggestionContent}`;
    }

    onChangeDraft(nextValue);
    setResult(null);
    setError(null);
  }, [draftText, onChangeDraft, result]);

  useEffect(() => {
    if (!block) {
      setPromptOpen(false);
      setInstructions("");
      setResult(null);
      setError(null);
      return;
    }

    setInstructions("");
    setError(null);
  }, [block?.id]);

  useEffect(() => {
    if (!isActive) {
      setPromptOpen(false);
    }
  }, [isActive]);

  const suggestionState: ParagraphSuggestionState = useMemo(
    () => ({
      promptOpen,
      instructions,
      onChangeInstructions: setInstructions,
      onSubmit: handleSubmit,
      onClosePrompt: closePrompt,
      isRequesting: isPending,
      error,
      result: result
        ? {
            ...result,
            onApply: handleApplyResult,
            onDismiss: handleDismissResult,
          }
        : null,
    }),
    [
      closePrompt,
      error,
      handleApplyResult,
      handleDismissResult,
      handleSubmit,
      instructions,
      isPending,
      promptOpen,
      result,
    ],
  );

  return {
    suggestionState,
    openPrompt,
    closePrompt,
    isPending,
  };
}

export function useParagraphBlockEditingSession({
  block,
  isActive,
  isSaving,
  chapterId,
  updateBlock,
  onComplete,
  sideEffects,
}: ParagraphBlockEditingSessionParams): ParagraphBlockEditingSession {
  const paragraphEditing = useParagraphEditingState({
    block,
    isActive,
    isSaving,
    updateBlock,
    onComplete,
    sideEffects,
  });

  const {
    suggestionState,
    openPrompt,
    closePrompt,
    isPending,
  } = useParagraphSuggestionController({
    block,
    isActive: Boolean(block && isActive),
    draftText: paragraphEditing.draftText,
    onChangeDraft: paragraphEditing.onChangeDraft,
    chapterId,
    notifyUpdateFailure: sideEffects.notifyUpdateFailure,
  });

  return {
    blockId: block?.id ?? null,
    isEditing: Boolean(block && isActive),
    draftText: paragraphEditing.draftText,
    onChangeDraft: paragraphEditing.onChangeDraft,
    hasPendingChanges: paragraphEditing.hasPendingChanges,
    save: paragraphEditing.save,
    suggestion: suggestionState,
    openSuggestionPrompt: openPrompt,
    closeSuggestionPrompt: closePrompt,
    isSuggestionPending: isPending,
  };
}
