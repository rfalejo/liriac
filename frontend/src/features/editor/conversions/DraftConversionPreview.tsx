import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import type { Theme } from "@mui/material/styles";
import type { BlockConversionBlock } from "../../../api/chapters";
import { getNarrativeBlockSpacing } from "../utils/blockSpacing";

export type DraftConversionPreviewProps = {
  blocks: BlockConversionBlock[];
  onAccept: () => void;
  onReject: () => void;
  accepting: boolean;
  error?: string | null;
};

export function DraftConversionPreview({
  blocks,
  onAccept,
  onReject,
  accepting,
  error,
}: DraftConversionPreviewProps) {
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
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Borrador generado por IA
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<ReplayRoundedIcon />}
            onClick={onReject}
            disabled={accepting}
          >
            Rechazar y editar
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CheckCircleRoundedIcon />}
            onClick={onAccept}
            disabled={accepting}
          >
            {accepting ? "Aceptando…" : "Aceptar conversión"}
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Stack spacing={0}>
        {blocks.map((block, index) => {
          const previousType = index > 0 ? blocks[index - 1]?.type : null;
          const marginTop = index === 0 ? 0 : getNarrativeBlockSpacing(previousType, block.type);

          return (
            <Box key={`draft-block-${index}`} sx={{ mt: marginTop }}>
              <DraftBlock block={block} />
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}

type DraftBlockProps = {
  block: BlockConversionBlock;
};

function DraftBlock({ block }: DraftBlockProps) {
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
