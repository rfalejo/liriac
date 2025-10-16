import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ContentPasteRoundedIcon from "@mui/icons-material/ContentPasteRounded";
import type { Theme } from "@mui/material/styles";
import type { BlockInsertPosition } from "../blocks/BlockInsertMenu";
import { BLOCK_INSERT_OPTIONS } from "../blocks/BlockInsertMenu";
import type { ChapterBlockType } from "../hooks/useChapterBlocks";
import { DraftConversionPreview } from "../conversions/DraftConversionPreview";
import type { DraftBlockConversion } from "../hooks/useBlockConversion";

type ChapterEmptyStateProps = {
  onInsertBlock?: (
    blockType: ChapterBlockType,
    position: BlockInsertPosition,
  ) => void;
  onOpenConversion?: (position: BlockInsertPosition) => void;
  conversionDisabled?: boolean;
  conversionDraft?: DraftBlockConversion | null;
  conversionApplying?: boolean;
  conversionApplyError?: string | null;
  onAcceptConversion?: () => void;
  onRejectConversion?: () => void;
};

export function ChapterEmptyState({
  onInsertBlock,
  onOpenConversion,
  conversionDisabled = false,
  conversionDraft,
  conversionApplying,
  conversionApplyError,
  onAcceptConversion,
  onRejectConversion,
}: ChapterEmptyStateProps) {
  const handleInsert = (blockType: ChapterBlockType) => {
    onInsertBlock?.(blockType, {
      afterBlockId: null,
      beforeBlockId: null,
      index: 0,
    });
  };

  const handleOpenConversion = () => {
    onOpenConversion?.({ afterBlockId: null, beforeBlockId: null, index: 0 });
  };

  const draft = conversionDraft ?? null;

  return (
    <Stack spacing={1.5} alignItems="flex-start">
      <Typography
        variant="body2"
        sx={(theme: Theme) => ({
          ...theme.typography.editorBody,
          color: theme.palette.editor.blockMuted,
        })}
      >
        Sin contenido. Añade un bloque para comenzar.
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        {onOpenConversion ? (
          <Button
            variant="contained"
            size="small"
            startIcon={<ContentPasteRoundedIcon fontSize="small" />}
            onClick={handleOpenConversion}
            disabled={conversionDisabled}
          >
            Pegar y convertir
          </Button>
        ) : null}
        {BLOCK_INSERT_OPTIONS.map(({ type, label, Icon }) => (
          <Button
            key={type}
            variant="outlined"
            size="small"
            startIcon={<Icon fontSize="small" />}
            onClick={() => handleInsert(type)}
          >
            {label}
          </Button>
        ))}
      </Stack>

      {draft ? (
        <Box
          sx={(theme) => ({
            width: "100%",
            mt: { xs: theme.spacing(2), sm: theme.spacing(2.5) },
          })}
        >
          <DraftConversionPreview
            blocks={draft.blocks}
            onAccept={() => {
              onAcceptConversion?.();
            }}
            onReject={() => {
              onRejectConversion?.();
            }}
            accepting={Boolean(conversionApplying)}
            error={conversionApplyError ?? null}
          />
        </Box>
  ) : null}
    </Stack>
  );
}
