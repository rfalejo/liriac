import { Typography } from "@mui/material";
import type { components } from "../../../api/schema";
import { editorThemeConstants } from "../editorTheme";
import { EditorBlockFrame } from "./EditorBlockFrame";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type ParagraphBlockProps = {
  block: ChapterBlock;
  onEdit: (blockId: string) => void;
};

export function ParagraphBlock({ block, onEdit }: ParagraphBlockProps) {
  const content = block.text?.trim() ?? "";

  return (
    <EditorBlockFrame
      blockId={block.id}
      blockType={block.type}
      onEdit={onEdit}
    >
      <Typography
        component="p"
        sx={{
          margin: 0,
          pb: 0,
          color: editorThemeConstants.headingColor,
          textIndent: "1.5em",
        }}
      >
        {content.length > 0 ? content : "(Sin texto en este párrafo)"}
      </Typography>
    </EditorBlockFrame>
  );
}
