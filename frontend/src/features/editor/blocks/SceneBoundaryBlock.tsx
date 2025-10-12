import { Divider, Stack, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { components } from "../../../api/schema";
import { EditorBlockFrame } from "./EditorBlockFrame";
import { useEditorBlockEditing } from "../context/EditorBlockEditingContext";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type SceneBoundaryBlockProps = {
  block: ChapterBlock;
};

export function SceneBoundaryBlock({ block }: SceneBoundaryBlockProps) {
  const { onEditBlock } = useEditorBlockEditing();

  return (
    <EditorBlockFrame
      blockId={block.id}
      blockType={block.type}
      onEdit={onEditBlock}
    >
      <Stack spacing={1} alignItems="center" sx={{ textAlign: "center" }}>
        <Divider
          flexItem
          sx={(theme: Theme) => ({
            borderColor: theme.palette.editor.blockDivider,
          })}
        />
        {(block.label || block.summary) && (
          <Typography
            variant="body2"
            sx={(theme: Theme) => ({
              ...theme.typography.editorBody,
              color: theme.palette.editor.blockMuted,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            })}
          >
            {block.label ?? block.summary}
          </Typography>
        )}
      </Stack>
    </EditorBlockFrame>
  );
}
