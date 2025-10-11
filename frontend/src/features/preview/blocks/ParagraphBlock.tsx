import { Typography } from "@mui/material";
import type { components } from "../../../api/schema";
import { readingThemeConstants } from "../readingTheme";
import { PreviewBlockFrame } from "./PreviewBlockFrame";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type ParagraphBlockProps = {
  block: ChapterBlock;
  onEdit: (blockId: string) => void;
};

export function ParagraphBlock({ block, onEdit }: ParagraphBlockProps) {
  const content = block.text?.trim() ?? "";

  return (
    <PreviewBlockFrame
      blockId={block.id}
      blockType={block.type}
      onEdit={onEdit}
    >
      <Typography
        component="p"
        sx={{
          margin: 0,
          color: readingThemeConstants.headingColor,
          textIndent: "1.75em",
        }}
      >
        {content.length > 0 ? content : "(Sin texto en este párrafo)"}
      </Typography>
    </PreviewBlockFrame>
  );
}
