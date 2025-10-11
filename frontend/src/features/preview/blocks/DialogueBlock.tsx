import { Box, Stack, Typography } from "@mui/material";
import type { components } from "../../../api/schema";
import { readingThemeConstants } from "../readingTheme";
import { PreviewBlockFrame } from "./PreviewBlockFrame";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type DialogueBlockProps = {
  block: ChapterBlock;
  onEdit: (blockId: string) => void;
};

export function DialogueBlock({ block, onEdit }: DialogueBlockProps) {
  const turns = block.turns ?? [];

  return (
    <PreviewBlockFrame
      blockId={block.id}
      blockType={block.type}
      onEdit={onEdit}
    >
      <Stack spacing={1.25} sx={{ color: readingThemeConstants.headingColor }}>
        {turns.length === 0 && (
          <Typography variant="body2" color={readingThemeConstants.mutedColor}>
            (Diálogo sin intervenciones)
          </Typography>
        )}
        {turns.map((turn, index) => (
          <Box key={`${block.id}-turn-${index}`}>
            {turn.speakerName && (
              <Typography
                component="span"
                sx={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: readingThemeConstants.mutedColor,
                }}
              >
                {turn.speakerName}
              </Typography>
            )}
            <Typography component="p" sx={{ margin: 0 }}>
              {turn.utterance}
            </Typography>
            {turn.stageDirection && (
              <Typography
                component="span"
                sx={{
                  fontStyle: "italic",
                  color: readingThemeConstants.mutedColor,
                }}
              >
                {turn.stageDirection}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    </PreviewBlockFrame>
  );
}
