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
    const primaryHeading = block.title ?? block.subtitle;
    const shouldShowSupportingTitle = Boolean(
      block.subtitle && block.title && block.subtitle !== block.title,
    );

    return (
      <PreviewBlockFrame
        blockId={block.id}
        blockType={block.type}
        onEdit={onEdit}
      >
        <Stack spacing={1} textAlign="center">
          {typeof block.ordinal === "number" && (
            <Typography
              variant="caption"
              sx={{
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: readingThemeConstants.mutedColor,
                opacity: 0.75,
              }}
            >
              Capítulo {block.ordinal + 1}
            </Typography>
          )}
          {primaryHeading && (
            <Typography
              variant="h4"
              sx={{
                fontFamily: "inherit",
                color: readingThemeConstants.headingColor,
              }}
            >
              {primaryHeading}
            </Typography>
          )}
          {shouldShowSupportingTitle && (
            <Typography
              variant="subtitle2"
              sx={{
                color: readingThemeConstants.mutedColor,
                fontWeight: 500,
                letterSpacing: "0.04em",
              }}
            >
              {block.subtitle}
            </Typography>
          )}
          {block.epigraph && (
            <Stack spacing={0.5} sx={{ mt: 1.25 }}>
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
