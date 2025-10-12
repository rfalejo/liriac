import { Divider, Stack, Typography } from "@mui/material";
import type { components } from "../../../api/schema";
import { editorThemeConstants } from "../editorTheme";
import { EditorBlockFrame } from "./EditorBlockFrame";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type SceneBoundaryBlockProps = {
  block: ChapterBlock;
  onEdit: (blockId: string) => void;
};

export function SceneBoundaryBlock({ block, onEdit }: SceneBoundaryBlockProps) {
  return (
    <EditorBlockFrame
      blockId={block.id}
      blockType={block.type}
      onEdit={onEdit}
    >
      <Stack spacing={1} alignItems="center" sx={{ textAlign: "center" }}>
        <Divider flexItem sx={{ borderColor: "rgba(15, 20, 25, 0.24)" }} />
        {(block.label || block.summary) && (
          <Typography
            variant="body2"
            sx={{
              color: editorThemeConstants.mutedColor,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {block.label ?? block.summary}
          </Typography>
        )}
      </Stack>
    </EditorBlockFrame>
  );
}
