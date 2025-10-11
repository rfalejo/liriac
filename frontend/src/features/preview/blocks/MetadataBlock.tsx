import { Stack, Typography } from "@mui/material";
import type { components } from "../../../api/schema";
import { readingThemeConstants } from "../readingTheme";
import { PreviewBlockFrame } from "./PreviewBlockFrame";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type MetadataBlockProps = {
  block: ChapterBlock;
  onEdit: (blockId: string) => void;
};

export function MetadataBlock({ block, onEdit }: MetadataBlockProps) {
  const kind = block.kind ?? "metadata";

  if (kind === "editorial") {
    return null;
  }

  if (kind === "chapter_header") {
    return (
      <PreviewBlockFrame
        blockId={block.id}
        blockType={block.type}
        onEdit={onEdit}
      >
        <Stack spacing={1.25} textAlign="center">
          {typeof block.ordinal === "number" && (
            <Typography
              variant="caption"
              sx={{
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: readingThemeConstants.mutedColor,
              }}
            >
              Capítulo {block.ordinal + 1}
            </Typography>
          )}
          {block.title && (
            <Typography
              variant="h4"
              sx={{
                fontFamily: "inherit",
                color: readingThemeConstants.headingColor,
              }}
            >
              {block.title}
            </Typography>
          )}
          {block.subtitle && (
            <Typography
              variant="subtitle1"
              sx={{ color: readingThemeConstants.mutedColor }}
            >
              {block.subtitle}
            </Typography>
          )}
          {block.epigraph && (
            <Stack spacing={0.5} sx={{ mt: 1.5 }}>
              <Typography
                component="blockquote"
                sx={{ fontStyle: "italic", margin: 0 }}
              >
                “{block.epigraph}”
              </Typography>
              {block.epigraphAttribution && (
                <Typography
                  variant="caption"
                  color={readingThemeConstants.mutedColor}
                >
                  — {block.epigraphAttribution}
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      </PreviewBlockFrame>
    );
  }

  if (kind === "context") {
    const contextText = block.context?.trim() ?? block.text?.trim();

    if (!contextText) {
      return null;
    }

    return (
      <PreviewBlockFrame
        blockId={block.id}
        blockType={block.type}
        onEdit={onEdit}
      >
        <Typography
          variant="body2"
          sx={{
            fontStyle: "italic",
            color: readingThemeConstants.mutedColor,
          }}
        >
          {contextText}
        </Typography>
      </PreviewBlockFrame>
    );
  }

  return (
    <PreviewBlockFrame
      blockId={block.id}
      blockType={block.type}
      onEdit={onEdit}
    >
      <Typography variant="body2" color={readingThemeConstants.mutedColor}>
        (Bloque de metadatos sin representación especializada)
      </Typography>
    </PreviewBlockFrame>
  );
}
