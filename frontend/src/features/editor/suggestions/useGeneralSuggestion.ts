import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { components } from "../../../api/schema";
import {
  fetchGeneralSuggestionPrompt,
  requestGeneralSuggestion,
  type BlockConversionBlock,
  type GeneralSuggestionRequestPayload,
} from "../../../api/chapters";

type ChapterBlock = components["schemas"]["ChapterBlock"];
type PlacementEnum = components["schemas"]["PlacementEnum"];

export type InsertionOption = "start" | "after" | "append";

type SuggestionResult = {
  blocks: BlockConversionBlock[];
};

type UseGeneralSuggestionParams = {
  open: boolean;
  chapterId: string | null;
  blocks: ChapterBlock[];
};

type UseGeneralSuggestionResult = {
  prompt: string;
  handlePromptChange: (value: string) => void;
  option: InsertionOption;
  handleChangeOption: (value: InsertionOption) => void;
  anchorBlockId: string;
  handleChangeAnchor: (value: string) => void;
  sortedBlocks: ChapterBlock[];
  pending: boolean;
  copyPending: boolean;
  error: string | null;
  copyError: string | null;
  copySuccess: boolean;
  result: SuggestionResult | null;
  canSubmit: boolean;
  canCopyPrompt: boolean;
  isBusy: boolean;
  handleGenerate: () => Promise<void>;
  handleCopyPrompt: () => Promise<void>;
};

export function useGeneralSuggestion({
  open,
  chapterId,
  blocks,
}: UseGeneralSuggestionParams): UseGeneralSuggestionResult {
  const sortedCacheRef = useRef<ChapterBlock[]>([]);

  const sortedBlocks = useMemo(() => {
    if (!open) {
      return sortedCacheRef.current;
    }

    const ordered = [...blocks].sort((a, b) => {
      const aPosition = typeof a.position === "number" ? a.position : 0;
      const bPosition = typeof b.position === "number" ? b.position : 0;
      return aPosition - bPosition;
    });

    sortedCacheRef.current = ordered;
    return ordered;
  }, [blocks, open]);

  const [prompt, setPrompt] = useState("");
  const [option, setOption] = useState<InsertionOption>("append");
  const [anchorBlockId, setAnchorBlockId] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [copyPending, setCopyPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [result, setResult] = useState<SuggestionResult | null>(null);

  const resetState = useCallback(() => {
    setPrompt("");
    setOption("append");
    setAnchorBlockId("");
    setPending(false);
    setCopyPending(false);
    setError(null);
    setCopyError(null);
    setCopySuccess(false);
    setResult(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (sortedBlocks.length === 0) {
      setAnchorBlockId("");
      return;
    }

    setAnchorBlockId((current) => {
      if (!current) {
        return sortedBlocks[0]?.id ?? "";
      }
      const isValid = sortedBlocks.some((block) => block.id === current);
      return isValid ? current : sortedBlocks[0]?.id ?? "";
    });
  }, [open, sortedBlocks]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (option === "after" && sortedBlocks.length === 0) {
      setOption("append");
    }
  }, [open, option, sortedBlocks]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (option === "after" && sortedBlocks.length > 0 && !anchorBlockId) {
      setAnchorBlockId(sortedBlocks[0]?.id ?? "");
    }
  }, [open, option, sortedBlocks, anchorBlockId]);

  useEffect(() => {
    if (!copySuccess) {
      return;
    }

    const timeout = typeof window !== "undefined"
      ? window.setTimeout(() => {
          setCopySuccess(false);
        }, 2400)
      : null;

    return () => {
      if (timeout) {
        window.clearTimeout(timeout);
      }
    };
  }, [copySuccess]);

  const trimmedPrompt = useMemo(() => prompt.trim(), [prompt]);
  const firstBlockId = sortedBlocks[0]?.id ?? "";

  const { placement, resolvedAnchor } = useMemo(() => {
    let resolvedPlacement: PlacementEnum = "append";
    let resolvedAnchorId: string | undefined;

    if (option === "start") {
      if (firstBlockId) {
        resolvedPlacement = "before";
        resolvedAnchorId = firstBlockId;
      } else {
        resolvedPlacement = "append";
      }
    } else if (option === "after") {
      resolvedPlacement = "after";
      resolvedAnchorId = anchorBlockId || undefined;
    }

    return {
      placement: resolvedPlacement,
      resolvedAnchor: resolvedAnchorId,
    };
  }, [option, firstBlockId, anchorBlockId]);

  const readyForPlacement = placement !== "after" || Boolean(resolvedAnchor);

  const canSubmit = useMemo(() => {
    return Boolean(
      chapterId &&
        trimmedPrompt.length > 0 &&
        !pending &&
        !copyPending &&
        readyForPlacement,
    );
  }, [chapterId, trimmedPrompt, pending, copyPending, readyForPlacement]);

  const canCopyPrompt = useMemo(() => {
    return Boolean(
      chapterId &&
        trimmedPrompt.length > 0 &&
        !pending &&
        !copyPending &&
        readyForPlacement,
    );
  }, [chapterId, trimmedPrompt, pending, copyPending, readyForPlacement]);

  const handlePromptChange = useCallback(
    (value: string) => {
      setPrompt(value);
      if (error) {
        setError(null);
      }
      if (copyError) {
        setCopyError(null);
      }
      if (copySuccess) {
        setCopySuccess(false);
      }
    },
    [error, copyError, copySuccess],
  );

  const handleChangeOption = useCallback(
    (value: InsertionOption) => {
      setOption(value);
      setError(null);
      setCopyError(null);
    },
    [],
  );

  const handleChangeAnchor = useCallback((value: string) => {
    setAnchorBlockId(value);
    setError(null);
    setCopyError(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!chapterId) {
      setError("Selecciona un capítulo antes de generar contenido.");
      return;
    }

    if (!trimmedPrompt) {
      setError("Escribe un prompt para solicitar sugerencias.");
      return;
    }

    if (placement === "after" && !resolvedAnchor) {
      setError("Selecciona el bloque de referencia para ubicar la sugerencia.");
      return;
    }

    setPending(true);
    setError(null);
    setCopyError(null);
    setCopySuccess(false);
    setResult(null);

    try {
      const payload: GeneralSuggestionRequestPayload = {
        prompt: trimmedPrompt,
        placement,
        anchorBlockId: resolvedAnchor,
      };

      const response = await requestGeneralSuggestion({
        chapterId,
        ...payload,
      });

      const blocksResponse = response.blocks ?? [];
      if (blocksResponse.length === 0) {
        setError("El modelo no devolvió contenido. Intenta ajustar el prompt.");
        setResult(null);
        return;
      }

      setResult({ blocks: blocksResponse });
    } catch (generationError) {
      console.error("General suggestion failed", generationError);
      setError("No pudimos generar la sugerencia. Inténtalo nuevamente.");
    } finally {
      setPending(false);
    }
  }, [chapterId, trimmedPrompt, placement, resolvedAnchor]);

  const handleCopyPrompt = useCallback(async () => {
    if (!chapterId) {
      setCopyError("Selecciona un capítulo antes de copiar el prompt.");
      return;
    }

    if (!trimmedPrompt) {
      setCopyError("Escribe un prompt antes de copiarlo.");
      return;
    }

    if (placement === "after" && !resolvedAnchor) {
      setCopyError("Elige el bloque de referencia para preparar el prompt.");
      return;
    }

    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopyError("El portapapeles no está disponible en este dispositivo.");
      return;
    }

    setCopyPending(true);
    setCopyError(null);
    setCopySuccess(false);

    try {
      const payload: GeneralSuggestionRequestPayload = {
        prompt: trimmedPrompt,
        placement,
        anchorBlockId: resolvedAnchor,
      };

      const response = await fetchGeneralSuggestionPrompt({
        chapterId,
        ...payload,
      });

      if (!response.prompt) {
        throw new Error("Empty prompt response");
      }

      await navigator.clipboard.writeText(response.prompt);
      setCopySuccess(true);
    } catch (copyPromptError) {
      console.error("Copy general suggestion prompt failed", copyPromptError);
      setCopyError("No pudimos copiar el prompt. Intenta de nuevo.");
    } finally {
      setCopyPending(false);
    }
  }, [chapterId, trimmedPrompt, placement, resolvedAnchor]);

  return {
    prompt,
    handlePromptChange,
    option,
    handleChangeOption,
    anchorBlockId,
    handleChangeAnchor,
    sortedBlocks,
    pending,
    copyPending,
    error,
    copyError,
    copySuccess,
    result,
    canSubmit,
    canCopyPrompt,
    isBusy: pending || copyPending,
    handleGenerate,
    handleCopyPrompt,
  };
}
