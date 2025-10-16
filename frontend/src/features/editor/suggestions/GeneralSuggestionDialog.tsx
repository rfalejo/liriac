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
import { getNarrativeBlockSpacing } from "../utils/blockSpacing";
import { useGeneralSuggestion, type InsertionOption } from "./useGeneralSuggestion";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type GeneralSuggestionDialogProps = {
  open: boolean;
  onClose: () => void;
  chapterId: string | null;
  blocks: ChapterBlock[];
};

export function GeneralSuggestionDialog({
  open,
  onClose,
  chapterId,
  blocks,
}: GeneralSuggestionDialogProps) {
  const {
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
    isBusy,
    handleGenerate,
    handleCopyPrompt,
  } = useGeneralSuggestion({ open, chapterId, blocks });

  const handleDialogClose = (_event: unknown, _reason?: unknown) => {
    void _event;
    void _reason;
    if (!isBusy) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (!isBusy) {
      onClose();
    }
  };

  const resultBlocks = result?.blocks ?? null;

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>Relleno con IA</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <SuggestionPromptSection
            value={prompt}
            disabled={isBusy}
            onChange={handlePromptChange}
          />
          <SuggestionPlacementSection
            option={option}
            sortedBlocks={sortedBlocks}
            anchorBlockId={anchorBlockId}
            disabled={isBusy}
            onOptionChange={handleChangeOption}
            onAnchorChange={handleChangeAnchor}
          />
          <SuggestionFeedback
            error={error}
            copyError={copyError}
            copySuccess={copySuccess}
          />
          {resultBlocks ? <SuggestionPreview blocks={resultBlocks} /> : null}
        </Stack>
      </DialogContent>
      <SuggestionDialogFooter
        pending={pending}
        copyPending={copyPending}
        canSubmit={canSubmit}
        canCopyPrompt={canCopyPrompt}
        disableCancel={isBusy}
        onCancel={handleCancel}
        onGenerate={handleGenerate}
        onCopyPrompt={handleCopyPrompt}
      />
    </Dialog>
  );
}

type SuggestionPromptSectionProps = {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
};

function SuggestionPromptSection({ value, disabled, onChange }: SuggestionPromptSectionProps) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        Prompt para la sugerencia
      </Typography>
      <TextField
        multiline
        minRows={4}
        maxRows={12}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder="Describe el relleno que necesitas"
        disabled={disabled}
      />
    </Stack>
  );
}

type SuggestionPlacementSectionProps = {
  option: InsertionOption;
  sortedBlocks: ChapterBlock[];
  anchorBlockId: string;
  disabled: boolean;
  onOptionChange: (value: InsertionOption) => void;
  onAnchorChange: (value: string) => void;
};

function SuggestionPlacementSection({
  option,
  sortedBlocks,
  anchorBlockId,
  disabled,
  onOptionChange,
  onAnchorChange,
}: SuggestionPlacementSectionProps) {
  const handleToggleChange = (_: unknown, value: InsertionOption | null) => {
    if (!value) {
      return;
    }
    onOptionChange(value);
  };

  const noBlocksAvailable = sortedBlocks.length === 0;

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        ¿Dónde quieres ubicar el relleno?
      </Typography>
      <ToggleButtonGroup
        exclusive
        value={option}
        onChange={handleToggleChange}
        fullWidth
        color="primary"
        aria-label="Seleccionar ubicación del relleno"
      >
        <ToggleButton value="start" disabled={disabled}>Inicio del capítulo</ToggleButton>
        <ToggleButton
          value="after"
          disabled={noBlocksAvailable || disabled}
        >
          Entre bloques
        </ToggleButton>
        <ToggleButton value="append" disabled={disabled}>Final del capítulo</ToggleButton>
      </ToggleButtonGroup>

      {option === "after" ? (
        <FormControl fullWidth disabled={noBlocksAvailable || disabled}>
          <InputLabel id="general-suggestion-anchor-label">
            Bloque de referencia
          </InputLabel>
          <Select<string>
            labelId="general-suggestion-anchor-label"
            label="Bloque de referencia"
            value={anchorBlockId}
            onChange={(event) => {
              onAnchorChange(event.target.value);
            }}
            disabled={noBlocksAvailable || disabled}
          >
            {sortedBlocks.map((block, index) => (
              <MenuItem key={block.id ?? `block-${index}`} value={block.id ?? ""}>
                {formatBlockOptionLabel(block, index)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : null}

      {option === "after" && noBlocksAvailable ? (
        <Alert severity="info">
          Agrega al menos un bloque antes de insertar relleno entre bloques.
        </Alert>
      ) : null}
    </Stack>
  );
}

type SuggestionFeedbackProps = {
  error: string | null;
  copyError: string | null;
  copySuccess: boolean;
};

function SuggestionFeedback({ error, copyError, copySuccess }: SuggestionFeedbackProps) {
  if (!error && !copyError && !copySuccess) {
    return null;
  }

  return (
    <Stack spacing={1.5}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {copyError ? <Alert severity="error">{copyError}</Alert> : null}
      {copySuccess ? (
        <Alert severity="success">Prompt copiado al portapapeles.</Alert>
      ) : null}
    </Stack>
  );
}

type SuggestionDialogFooterProps = {
  pending: boolean;
  copyPending: boolean;
  canSubmit: boolean;
  canCopyPrompt: boolean;
  disableCancel: boolean;
  onCancel: () => void;
  onGenerate: () => Promise<void>;
  onCopyPrompt: () => Promise<void>;
};

function SuggestionDialogFooter({
  pending,
  copyPending,
  canSubmit,
  canCopyPrompt,
  disableCancel,
  onCancel,
  onGenerate,
  onCopyPrompt,
}: SuggestionDialogFooterProps) {
  return (
    <DialogActions sx={{ px: 3, py: 2 }}>
      <Button onClick={onCancel} disabled={disableCancel}>
        Cancelar
      </Button>
      <Button
        variant="outlined"
        onClick={() => {
          void onCopyPrompt();
        }}
        disabled={!canCopyPrompt}
      >
        {copyPending ? "Copiando…" : "Copiar prompt"}
      </Button>
      <Button
        variant="contained"
        onClick={() => {
          void onGenerate();
        }}
        disabled={!canSubmit}
      >
        {pending ? "Generando…" : "Generar"}
      </Button>
    </DialogActions>
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
