import { Divider, Stack, Typography } from "@mui/material";
import type { components } from "../../../api/schema";
import { readingThemeConstants } from "../readingTheme";
import { PreviewBlockFrame } from "./PreviewBlockFrame";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type SceneBoundaryBlockProps = {
  block: ChapterBlock;
  onEdit: (blockId: string) => void;
};

export function SceneBoundaryBlock({ block, onEdit }: SceneBoundaryBlockProps) {
  return (
    <PreviewBlockFrame blockId={block.id} blockType={block.type} onEdit={onEdit}>
      <Stack spacing={1.25} alignItems="center" sx={{ textAlign: "center" }}>
        <Divider flexItem sx={{ borderColor: "rgba(15, 20, 25, 0.24)" }} />
        {(block.label || block.summary) && (
          <Typography
            variant="body2"
            sx={{
              color: readingThemeConstants.mutedColor,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {block.label ?? block.summary}
          </Typography>
        )}
      </Stack>
    </PreviewBlockFrame>
  );
}
