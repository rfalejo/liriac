import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ContentPasteRoundedIcon from "@mui/icons-material/ContentPasteRounded";
import type { Theme } from "@mui/material/styles";
import type { BlockInsertPosition } from "../blocks/BlockInsertMenu";
import { BLOCK_INSERT_OPTIONS } from "../blocks/BlockInsertMenu";
import type { ChapterBlockType } from "../hooks/useChapterBlocks";

type ChapterEmptyStateProps = {
  onInsertBlock?: (
    blockType: ChapterBlockType,
    position: BlockInsertPosition,
  ) => void;
  onOpenConversion?: () => void;
  conversionDisabled?: boolean;
};

export function ChapterEmptyState({
  onInsertBlock,
  onOpenConversion,
  conversionDisabled = false,
}: ChapterEmptyStateProps) {
  const handleInsert = (blockType: ChapterBlockType) => {
    onInsertBlock?.(blockType, {
      afterBlockId: null,
      beforeBlockId: null,
      index: 0,
    });
  };

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
            onClick={onOpenConversion}
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
    </Stack>
  );
}
