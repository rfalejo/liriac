import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import type { components } from "../../../api/schema";
import type { BlockConversionBlock } from "../../../api/chapters";
import {
  fetchGeneralSuggestionPrompt,
  requestGeneralSuggestion,
  type GeneralSuggestionRequestPayload,
} from "../../../api/chapters";
import { getNarrativeBlockSpacing } from "../utils/blockSpacing";

type ChapterBlock = components["schemas"]["ChapterBlock"];
type PlacementEnum = components["schemas"]["PlacementEnum"];

type InsertionOption = "start" | "after" | "append";

type GeneralSuggestionDialogProps = {
  open: boolean;
  onClose: () => void;
  chapterId: string | null;
  blocks: ChapterBlock[];
};

type SuggestionResult = {
  blocks: BlockConversionBlock[];
};

export function GeneralSuggestionDialog({
  open,
  onClose,
  chapterId,
  blocks,
}: GeneralSuggestionDialogProps) {
  const sortedBlocks = useMemo(() => {
    return [...blocks].sort((a, b) => {
      const aPosition = typeof a.position === "number" ? a.position : 0;
      const bPosition = typeof b.position === "number" ? b.position : 0;
      return aPosition - bPosition;
    });
  }, [blocks]);

  const firstBlockId = sortedBlocks[0]?.id ?? "";

  const [prompt, setPrompt] = useState("");
  const [option, setOption] = useState<InsertionOption>("append");
  const [anchorBlockId, setAnchorBlockId] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [copyPending, setCopyPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [result, setResult] = useState<SuggestionResult | null>(null);

  useEffect(() => {
    if (!open) {
      setPrompt("");
      setOption("append");
      setAnchorBlockId("");
      setPending(false);
      setCopyPending(false);
      setError(null);
      setCopyError(null);
      setCopySuccess(false);
      setResult(null);
      return;
    }

    if (sortedBlocks.length === 0) {
      setAnchorBlockId("");
    } else if (!anchorBlockId || !sortedBlocks.some((block) => block.id === anchorBlockId)) {
      setAnchorBlockId(sortedBlocks[0]?.id ?? "");
    }
  }, [open, sortedBlocks, anchorBlockId]);

  useEffect(() => {
    if (option === "after" && sortedBlocks.length > 0 && !anchorBlockId) {
      setAnchorBlockId(sortedBlocks[0]?.id ?? "");
    }
    if (option === "after" && sortedBlocks.length === 0) {
      setOption("append");
    }
  }, [option, sortedBlocks, anchorBlockId]);

  useEffect(() => {
    if (!copySuccess) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setCopySuccess(false);
    }, 2400);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [copySuccess]);

  const trimmedPrompt = prompt.trim();

  const { placement, anchorBlockId: resolvedAnchor } = useMemo(() => {
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
    } else {
      resolvedPlacement = "append";
    }

    return {
      placement: resolvedPlacement,
      anchorBlockId: resolvedAnchorId,
    };
  }, [option, firstBlockId, anchorBlockId]);

  const canSubmit = Boolean(
    chapterId &&
      trimmedPrompt.length > 0 &&
      !pending &&
      !copyPending &&
      (placement !== "after" || resolvedAnchor),
  );

  const canCopyPrompt = Boolean(
    chapterId &&
      trimmedPrompt.length > 0 &&
      !pending &&
      !copyPending &&
      (placement !== "after" || resolvedAnchor),
  );

  const handleGenerate = async () => {
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
  };

  const handleCopyPrompt = async () => {
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
  };

  const handleChangeOption = (_: unknown, value: InsertionOption | null) => {
    if (!value) {
      return;
    }
    setOption(value);
    setError(null);
  };

  const renderedResult = result ? (
    <SuggestionPreview blocks={result.blocks} />
  ) : null;

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!pending && !copyPending) {
          onClose();
        }
      }}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>Relleno con IA</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Prompt para la sugerencia
            </Typography>
            <TextField
              multiline
              minRows={4}
              maxRows={12}
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
              }}
              placeholder="Describe el relleno que necesitas"
              disabled={pending || copyPending}
            />
          </Stack>

          <Stack spacing={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              ¿Dónde quieres ubicar el relleno?
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={option}
              onChange={handleChangeOption}
              fullWidth
              color="primary"
              aria-label="Seleccionar ubicación del relleno"
            >
              <ToggleButton value="start">Inicio del capítulo</ToggleButton>
              <ToggleButton
                value="after"
                disabled={sortedBlocks.length === 0}
              >
                Entre bloques
              </ToggleButton>
              <ToggleButton value="append">Final del capítulo</ToggleButton>
            </ToggleButtonGroup>

            {option === "after" ? (
              <FormControl fullWidth disabled={sortedBlocks.length === 0}>
                <InputLabel id="general-suggestion-anchor-label">
                  Bloque de referencia
                </InputLabel>
                <Select<string>
                  labelId="general-suggestion-anchor-label"
                  label="Bloque de referencia"
                  value={anchorBlockId}
                  onChange={(event) => {
                    setAnchorBlockId(event.target.value);
                  }}
                  disabled={sortedBlocks.length === 0 || pending || copyPending}
                >
                  {sortedBlocks.map((block, index) => (
                    <MenuItem key={block.id ?? `block-${index}`} value={block.id ?? ""}>
                      {formatBlockOptionLabel(block, index)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : null}

            {option === "after" && sortedBlocks.length === 0 ? (
              <Alert severity="info">
                Agrega al menos un bloque antes de insertar relleno entre bloques.
              </Alert>
            ) : null}
          </Stack>

          {error ? <Alert severity="error">{error}</Alert> : null}
          {copyError ? <Alert severity="error">{copyError}</Alert> : null}
          {copySuccess ? (
            <Alert severity="success">Prompt copiado al portapapeles.</Alert>
          ) : null}

          {renderedResult}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          disabled={pending || copyPending}
        >
          Cancelar
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            void handleCopyPrompt();
          }}
          disabled={!canCopyPrompt || pending || copyPending}
        >
          {copyPending ? "Copiando…" : "Copiar prompt"}
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            void handleGenerate();
          }}
          disabled={!canSubmit}
        >
          {pending ? "Generando…" : "Generar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type SuggestionPreviewProps = {
  blocks: BlockConversionBlock[];
};

function SuggestionPreview({ blocks }: SuggestionPreviewProps) {
  return (
    <Paper
      variant="outlined"
      sx={(theme: Theme) => ({
        borderRadius: theme.editor.blockRadius,
        borderColor: theme.palette.editor.suggestionHighlightBorder,
        backgroundColor: theme.palette.editor.suggestionHighlightBg,
        color: theme.palette.editor.suggestionHighlightText,
        px: { xs: 2.25, sm: 3 },
        py: { xs: 2, sm: 2.5 },
        display: "flex",
        flexDirection: "column",
        gap: 2,
      })}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        Propuesta generada
      </Typography>
      <Stack spacing={0}>
        {blocks.map((block, index) => {
          const previousType = index > 0 ? blocks[index - 1]?.type ?? null : null;
          const marginTop = index === 0
            ? 0
            : getNarrativeBlockSpacing(previousType, block.type);
          return (
            <Box key={`suggestion-block-${index}`} sx={{ mt: marginTop }}>
              <SuggestionBlock block={block} />
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}

type SuggestionBlockProps = {
  block: BlockConversionBlock;
};

function SuggestionBlock({ block }: SuggestionBlockProps) {
  if (block.type === "paragraph") {
    return (
      <Typography component="p" sx={(theme: Theme) => theme.typography.editorParagraph}>
        {block.text}
      </Typography>
    );
  }

  if (block.type === "dialogue") {
    const turns = block.turns ?? [];
    return (
      <Stack spacing={1}>
        {block.context ? (
          <Typography
            variant="body2"
            sx={(theme: Theme) => ({
              ...theme.typography.editorMuted,
              color: theme.palette.editor.blockMuted,
            })}
          >
            {block.context}
          </Typography>
        ) : null}
        <Stack spacing={1}>
          {turns.map((turn, index) => {
            const key = turn.id ?? `turn-${index}`;
            return (
              <Box
                key={key}
                sx={{
                  borderRadius: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  px: { xs: 1.25, sm: 1.5 },
                  py: { xs: 1, sm: 1.25 },
                }}
              >
                <Stack spacing={0.5}>
                  {turn.speakerName ? (
                    <Typography
                      component="span"
                      sx={(theme: Theme) => theme.typography.editorDialogueSpeaker}
                    >
                      {turn.speakerName}
                    </Typography>
                  ) : null}
                  <Typography
                    component="p"
                    sx={(theme: Theme) => ({
                      ...theme.typography.editorBody,
                      margin: 0,
                    })}
                  >
                    {turn.utterance}
                  </Typography>
                  {turn.stageDirection ? (
                    <Typography
                      component="span"
                      sx={(theme: Theme) => theme.typography.editorStageDirection}
                    >
                      {turn.stageDirection}
                    </Typography>
                  ) : null}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Stack>
    );
  }

  return null;
}

function formatBlockOptionLabel(block: ChapterBlock, index: number) {
  const prefix = `Bloque ${index + 1}`;

  if (block.type === "paragraph") {
    const text = (block.text ?? "").trim();
    if (!text) {
      return `${prefix}: Párrafo vacío`;
    }
    return `${prefix}: ${truncate(text)}`;
  }

  if (block.type === "dialogue") {
    const firstTurn = block.turns?.[0];
    const speaker = firstTurn?.speakerName?.trim();
    const utterance = firstTurn?.utterance?.trim();
    if (speaker || utterance) {
      return `${prefix}: Diálogo ${speaker ? `(${speaker}) ` : ""}${utterance ? truncate(utterance) : ""}`;
    }
    return `${prefix}: Diálogo`;
  }

  if (block.type === "scene_boundary") {
    const label = block.label?.trim();
    const summary = block.summary?.trim();
    const location = block.locationName?.trim();
    const descriptor = label || summary || location;
    if (descriptor) {
      return `${prefix}: Escena ${truncate(descriptor)}`;
    }
    return `${prefix}: Escena`;
  }

  if (block.type === "metadata") {
    const title = block.title?.trim();
    const subtitle = block.subtitle?.trim();
    if (title || subtitle) {
      return `${prefix}: ${truncate([title, subtitle].filter(Boolean).join(" — "))}`;
    }
    return `${prefix}: Metadatos`;
  }

  return prefix;
}

function truncate(value: string, maxLength = 72) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}
