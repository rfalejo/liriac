import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  BlockConversionBlock,
  ChapterBlockCreatePayload,
  ChapterDetail,
} from "../../../api/chapters";
import {
  fetchGeneralSuggestionPrompt,
  requestGeneralSuggestion,
} from "../../../api/chapters";
import type { components } from "../../../api/schema";
import { chapterQueryKeys } from "../../library/libraryQueryKeys";
import type { BlockInsertPosition } from "../blocks/BlockInsertMenu";
import {
  attachPosition,
  generateBlockId,
} from "../utils/blockCreation";
import { generateTurnId } from "../utils/dialogueTurns";
import { useCreateChapterBlock } from "../hooks/useCreateChapterBlock";

const FALLBACK_ERROR = "No se pudo procesar la sugerencia.";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return FALLBACK_ERROR;
}

type Placement = components["schemas"]["PlacementEnum"];

const DEFAULT_PLACEMENT: Placement = "append";

type SuggestionRequestContext = {
  prompt: string;
  placement: Placement;
  anchorBlockId: string | null;
  model?: string | null;
};

export type GeneralSuggestionDraft = {
  id: string;
  blocks: BlockConversionBlock[];
  position: BlockInsertPosition;
  placement: Placement;
  anchorBlockId: string | null;
  prompt: string;
  model: string | null;
};

type UseGeneralSuggestionOptions = {
  chapterId: string | null | undefined;
  chapter: ChapterDetail | null;
};

type SubmitArgs = {
  prompt: string;
};

type CopyResult = {
  success: boolean;
  message: string;
};

export type UseGeneralSuggestionResult = {
  draft: GeneralSuggestionDraft | null;
  requestPending: boolean;
  requestError: string | null;
  applyPending: boolean;
  applyError: string | null;
  submit: (args: SubmitArgs) => Promise<void>;
  rejectDraft: () => void;
  acceptDraft: () => Promise<void>;
  clearRequestError: () => void;
  copyPrompt: (args: SubmitArgs) => Promise<CopyResult>;
};

export function useGeneralSuggestion({
  chapterId,
  chapter,
}: UseGeneralSuggestionOptions): UseGeneralSuggestionResult {
  const queryClient = useQueryClient();
  const { createBlock, isPending: createPending } = useCreateChapterBlock({
    chapterId,
  });

  const [draft, setDraft] = useState<GeneralSuggestionDraft | null>(null);
  const [requestPending, setRequestPending] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [applyPending, setApplyPending] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<SuggestionRequestContext | null>(
    null,
  );

  useEffect(() => {
    setDraft(null);
    setRequestPending(false);
    setRequestError(null);
    setApplyPending(false);
    setApplyError(null);
    setLastRequest(null);
  }, [chapterId]);

  const latestChapter = useMemo(() => {
    if (!chapterId) {
      return chapter;
    }
    return (
      queryClient.getQueryData<ChapterDetail>(chapterQueryKeys.detail(chapterId)) ??
      chapter ??
      null
    );
  }, [chapter, chapterId, queryClient]);

  const resolvePosition = useCallback(
    (
      sourceChapter: ChapterDetail | null,
      placement: Placement,
      anchorBlockId: string | null,
    ): BlockInsertPosition => {
      const orderedBlocks = [...(sourceChapter?.blocks ?? [])].sort((a, b) => {
        const aPosition = typeof a.position === "number" ? a.position : 0;
        const bPosition = typeof b.position === "number" ? b.position : 0;
        return aPosition - bPosition;
      });

      if (orderedBlocks.length === 0) {
        return {
          afterBlockId: null,
          beforeBlockId: null,
          index: 0,
        };
      }

      if (placement === "before" && anchorBlockId) {
        const anchorIndex = orderedBlocks.findIndex((block) => block.id === anchorBlockId);
        if (anchorIndex >= 0) {
          const previousBlock = anchorIndex > 0 ? orderedBlocks[anchorIndex - 1] : null;
          return {
            afterBlockId: previousBlock?.id ?? null,
            beforeBlockId: orderedBlocks[anchorIndex]?.id ?? null,
            index: anchorIndex,
          };
        }
      }

      if (placement === "after" && anchorBlockId) {
        const anchorIndex = orderedBlocks.findIndex((block) => block.id === anchorBlockId);
        if (anchorIndex >= 0) {
          const nextBlock =
            anchorIndex + 1 < orderedBlocks.length
              ? orderedBlocks[anchorIndex + 1]
              : null;
          return {
            afterBlockId: orderedBlocks[anchorIndex]?.id ?? null,
            beforeBlockId: nextBlock?.id ?? null,
            index: Math.min(anchorIndex + 1, orderedBlocks.length),
          };
        }
      }

      const lastBlock = orderedBlocks[orderedBlocks.length - 1] ?? null;
      return {
        afterBlockId: lastBlock?.id ?? null,
        beforeBlockId: null,
        index: orderedBlocks.length,
      };
    },
    [],
  );

  const submit = useCallback(
    async ({ prompt }: SubmitArgs) => {
      if (!chapterId) {
        setRequestError("Selecciona un capítulo antes de generar sugerencias.");
        return;
      }

      const cleanedPrompt = prompt.trim();
      if (!cleanedPrompt) {
        setRequestError("Escribe un prompt antes de enviar.");
        return;
      }

      const placement = DEFAULT_PLACEMENT;
      const anchorBlockId = null;

      setRequestPending(true);
      setRequestError(null);
      setApplyError(null);

      try {
        const response = await requestGeneralSuggestion({
          chapterId,
          prompt: cleanedPrompt,
          placement,
          anchorBlockId: anchorBlockId ?? undefined,
        });

        const resolvedPosition = resolvePosition(latestChapter, placement, anchorBlockId);

        setDraft({
          id: `general-${Date.now()}`,
          blocks: response.blocks,
          position: resolvedPosition,
          placement,
          anchorBlockId,
          prompt: cleanedPrompt,
          model: response.model ?? null,
        });
        setLastRequest({
          prompt: cleanedPrompt,
          placement,
          anchorBlockId,
          model: response.model ?? null,
        });
      } catch (error) {
        setRequestError(getErrorMessage(error));
      } finally {
        setRequestPending(false);
      }
    },
    [chapterId, latestChapter, resolvePosition],
  );

  const rejectDraft = useCallback(() => {
    setDraft(null);
    setApplyError(null);
  }, []);

  const buildInsertPosition = useCallback(
    (base: BlockInsertPosition, insertedIds: string[]): BlockInsertPosition => {
      if (insertedIds.length === 0) {
        return base;
      }

      return {
        afterBlockId: insertedIds[insertedIds.length - 1],
        beforeBlockId: base.beforeBlockId,
        index: base.index + insertedIds.length,
      };
    },
    [],
  );

  const buildPayloadFromBlock = useCallback(
    (block: BlockConversionBlock, blockId: string): ChapterBlockCreatePayload => {
      if (block.type === "paragraph") {
        return {
          id: blockId,
          type: "paragraph",
          text: block.text ?? "",
          style: "narration",
          tags: [],
        };
      }

      if (block.type === "dialogue") {
        const turns = (block.turns ?? []).map((turn) => ({
          id: turn.id ?? generateTurnId(),
          speakerId: turn.speakerId ?? null,
          speakerName: turn.speakerName ?? null,
          utterance: turn.utterance ?? "",
          stageDirection: turn.stageDirection ?? null,
          tone: null,
        }));

        if (turns.length === 0) {
          turns.push({
            id: generateTurnId(),
            speakerId: null,
            speakerName: null,
            utterance: block.text ?? "",
            stageDirection: null,
            tone: null,
          });
        }

        return {
          id: blockId,
          type: "dialogue",
          turns,
          context: block.context ?? null,
        };
      }

      return {
        id: blockId,
        type: "paragraph",
        text: block.text ?? "",
        style: "narration",
        tags: [],
      };
    },
    [],
  );

  const acceptDraft = useCallback(async () => {
    if (!chapterId || !draft) {
      return;
    }

    if (draft.blocks.length === 0) {
      setDraft(null);
      return;
    }

    setApplyPending(true);
    setApplyError(null);

    try {
      const currentChapter =
        queryClient.getQueryData<ChapterDetail>(chapterQueryKeys.detail(chapterId)) ??
        latestChapter ??
        null;

      let workingChapter: ChapterDetail | null = currentChapter;
      const insertedIds: string[] = [];

      for (const block of draft.blocks) {
        const blockId = generateBlockId();
        const basePosition = draft.position;
        const positionForBlock = buildInsertPosition(basePosition, insertedIds);
        const payload = buildPayloadFromBlock(block, blockId);
        const positionedPayload = attachPosition(payload, positionForBlock, workingChapter);
        const updatedChapter = await createBlock({ payload: positionedPayload });
        workingChapter = updatedChapter;
        insertedIds.push(blockId);
      }

      setDraft(null);
    } catch (error) {
      setApplyError(getErrorMessage(error));
    } finally {
      setApplyPending(false);
    }
  }, [
    buildInsertPosition,
    buildPayloadFromBlock,
    chapterId,
    createBlock,
    draft,
    latestChapter,
    queryClient,
  ]);

  const clearRequestError = useCallback(() => {
    setRequestError(null);
  }, []);

  const copyPrompt = useCallback(
    async ({ prompt }: SubmitArgs): Promise<CopyResult> => {
      if (!chapterId) {
        throw new Error("Selecciona un capítulo antes de copiar el prompt.");
      }

      const cleanedPrompt = prompt.trim();
      if (!cleanedPrompt) {
        throw new Error("Escribe un prompt antes de copiar.");
      }

      const context = lastRequest ?? {
        prompt: cleanedPrompt,
        placement: DEFAULT_PLACEMENT,
        anchorBlockId: null,
        model: draft?.model ?? null,
      };

      try {
        const response = await fetchGeneralSuggestionPrompt({
          chapterId,
          prompt: cleanedPrompt,
          placement: context.placement,
          anchorBlockId: context.anchorBlockId ?? undefined,
          model: context.model ?? undefined,
        });

        if (typeof navigator === "undefined" || !navigator.clipboard) {
          throw new Error("El portapapeles no está disponible en este navegador.");
        }

        await navigator.clipboard.writeText(response.prompt);
        return {
          success: true,
          message: "Prompt copiado al portapapeles.",
        };
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    [chapterId, draft?.model, lastRequest],
  );

  return {
    draft,
    requestPending,
    requestError,
    applyPending: applyPending || createPending,
    applyError,
    submit,
    rejectDraft,
    acceptDraft,
    clearRequestError,
    copyPrompt,
  } satisfies UseGeneralSuggestionResult;
}
