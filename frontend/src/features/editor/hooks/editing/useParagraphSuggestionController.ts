import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChapterBlock, ParagraphSuggestionState } from "../../types";
import { useParagraphSuggestionRequest } from "../useParagraphSuggestionRequest";

type ParagraphBlock = ChapterBlock & { type: "paragraph" };

type SuggestionResult = {
  instructions: string;
  text: string;
  isApplied: boolean;
};

type ParagraphSuggestionControllerParams = {
  block: ParagraphBlock | null;
  isActive: boolean;
  draftText: string;
  onChangeDraft: (value: string) => void;
  chapterId: string | null;
  notifyUpdateFailure: (error: unknown) => void;
};

export function useParagraphSuggestionController({
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
  const [draftSnapshot, setDraftSnapshot] = useState<string | null>(null);

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

    setDraftSnapshot(draftText);

    try {
      const response = await requestSuggestion({
        blockId: block.id,
        instructions: trimmed,
      });

      setResult({
        instructions: trimmed,
        text: response.paragraphSuggestion,
        isApplied: false,
      });
      setPromptOpen(false);
      setInstructions("");
      setError(null);
    } catch (suggestionError) {
      setError("No pudimos generar la sugerencia. Inténtalo de nuevo.");
      notifyUpdateFailure(suggestionError);
      setDraftSnapshot(null);
    }
  }, [
    block,
    draftText,
    instructions,
    isActive,
    notifyUpdateFailure,
    requestSuggestion,
  ]);

  const handleDismissResult = useCallback(() => {
    const wasApplied = result?.isApplied ?? false;

    setResult(null);
    setError(null);

    if (wasApplied && draftSnapshot !== null) {
      onChangeDraft(draftSnapshot);
    }

    setDraftSnapshot(null);
  }, [draftSnapshot, onChangeDraft, result]);

  const handleApplyResult = useCallback(() => {
    if (!result) {
      return;
    }

    const suggestionContent = result.text;

    onChangeDraft(suggestionContent);
    setResult({
      instructions: result.instructions,
      text: result.text,
      isApplied: true,
    });
    setError(null);
  }, [onChangeDraft, result]);

  useEffect(() => {
    if (!block) {
      setPromptOpen(false);
      setInstructions("");
      setResult(null);
      setError(null);
      setDraftSnapshot(null);
      return;
    }

    setInstructions("");
    setError(null);
    setDraftSnapshot(null);
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
            instructions: result.instructions,
            text: result.text,
            isApplied: result.isApplied,
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
