import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  BlockConversionBlock,
  BlockConversionResponse,
  ChapterDetail,
} from "../../../api/chapters";
import {
  applyBlockConversion,
  requestBlockConversion,
} from "../../../api/chapters";
import { chapterQueryKeys } from "../../library/libraryQueryKeys";

export type DraftBlockConversion = {
  conversionId: string;
  blocks: BlockConversionBlock[];
  sourceText: string;
};

export type UseBlockConversionState = {
  draft: DraftBlockConversion | null;
  dialogOpen: boolean;
  conversionText: string;
  canSubmitConversion: boolean;
  conversionPending: boolean;
  conversionError: string | null;
  applyPending: boolean;
  applyError: string | null;
  canOpenDialog: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  setConversionText: (value: string) => void;
  submitConversion: () => Promise<void>;
  acceptDraft: () => Promise<void>;
  rejectDraft: () => void;
  clearConversionError: () => void;
};

type UseBlockConversionOptions = {
  chapterId: string | null | undefined;
};

const FALLBACK_ERROR = "No se pudo procesar la solicitud.";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return FALLBACK_ERROR;
}

export function useBlockConversion({
  chapterId,
}: UseBlockConversionOptions): UseBlockConversionState {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [conversionText, setConversionText] = useState("");
  const [draft, setDraft] = useState<DraftBlockConversion | null>(null);
  const [conversionPending, setConversionPending] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [applyPending, setApplyPending] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(null);
    setConversionError(null);
    setApplyError(null);
    setConversionPending(false);
    setApplyPending(false);
    setDialogOpen(false);
    setConversionText("");
  }, [chapterId]);

  const canOpenDialog = Boolean(chapterId) && !applyPending;

  const openDialog = useCallback(() => {
    if (!canOpenDialog) {
      return;
    }
    setConversionError(null);
    setDialogOpen(true);
  }, [canOpenDialog]);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const trimmedText = useMemo(() => conversionText.trim(), [conversionText]);

  const canSubmitConversion = Boolean(trimmedText) && Boolean(chapterId) && !conversionPending && !applyPending;

  const clearConversionError = useCallback(() => {
    setConversionError(null);
  }, []);

  const submitConversion = useCallback(async () => {
    if (!chapterId) {
      setConversionError("Selecciona un capítulo antes de convertir.");
      return;
    }

    if (!trimmedText || conversionPending || applyPending) {
      return;
    }

    setConversionPending(true);
    setConversionError(null);

    try {
      const response: BlockConversionResponse = await requestBlockConversion({
        chapterId,
        text: conversionText,
      });

      setDraft({
        conversionId: response.conversionId,
        blocks: response.blocks,
        sourceText: conversionText,
      });
      setDialogOpen(false);
      setApplyError(null);
    } catch (error) {
      setConversionError(getErrorMessage(error));
    } finally {
      setConversionPending(false);
    }
  }, [chapterId, conversionText, trimmedText, conversionPending, applyPending]);

  const acceptDraft = useCallback(async () => {
    if (!chapterId || !draft || applyPending) {
      return;
    }

    setApplyPending(true);
    setApplyError(null);

    try {
      const updatedChapter: ChapterDetail = await applyBlockConversion({
        conversionId: draft.conversionId,
        placement: "append",
      });

      queryClient.setQueryData(chapterQueryKeys.detail(chapterId), updatedChapter);
      setDraft(null);
      setConversionText("");
    } catch (error) {
      setApplyError(getErrorMessage(error));
    } finally {
      setApplyPending(false);
    }
  }, [chapterId, draft, applyPending, queryClient]);

  const rejectDraft = useCallback(() => {
    if (!draft) {
      return;
    }
    setDraft(null);
    setApplyError(null);
    setConversionError(null);
    setDialogOpen(true);
  }, [draft]);

  return {
    draft,
    dialogOpen,
    conversionText,
    canSubmitConversion,
    conversionPending,
    conversionError,
    applyPending,
    applyError,
    canOpenDialog,
    openDialog,
    closeDialog,
    setConversionText,
    submitConversion,
    acceptDraft,
    rejectDraft,
    clearConversionError,
  };
}
