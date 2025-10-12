import { Stack, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { components } from "../../../api/schema";
import { EditorBlockFrame } from "./EditorBlockFrame";

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
      <EditorBlockFrame
        blockId={block.id}
        blockType={block.type}
        onEdit={onEdit}
      >
        <Stack spacing={1} textAlign="center">
          {typeof block.ordinal === "number" && (
            <Typography
              variant="caption"
              sx={(theme: Theme) => ({
                fontFamily: theme.typography.editorBody.fontFamily,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: theme.palette.editor.blockMuted,
                opacity: 0.75,
              })}
            >
              Capítulo {block.ordinal + 1}
            </Typography>
          )}
          {primaryHeading && (
            <Typography
              variant="h4"
              sx={(theme: Theme) => ({
                fontFamily: "inherit",
                color: theme.palette.editor.blockHeading,
              })}
            >
              {primaryHeading}
            </Typography>
          )}
          {shouldShowSupportingTitle && (
            <Typography
              variant="subtitle2"
              sx={(theme: Theme) => ({
                fontFamily: theme.typography.editorBody.fontFamily,
                color: theme.palette.editor.blockMuted,
                fontWeight: 500,
                letterSpacing: "0.04em",
              })}
            >
              {block.subtitle}
            </Typography>
          )}
          {block.epigraph && (
            <Stack spacing={0.5} sx={{ mt: 1.25 }}>
              <Typography
                component="blockquote"
                sx={(theme: Theme) => ({
                  ...theme.typography.editorBody,
                  fontStyle: "italic",
                  margin: 0,
                })}
              >
                “{block.epigraph}”
              </Typography>
              {block.epigraphAttribution && (
                <Typography
                  variant="caption"
                  sx={(theme: Theme) => ({
                    fontFamily: theme.typography.editorBody.fontFamily,
                    color: theme.palette.editor.blockMuted,
                  })}
                >
                  — {block.epigraphAttribution}
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      </EditorBlockFrame>
    );
  }

  if (kind === "context") {
    const contextText = block.context?.trim() ?? block.text?.trim();

    if (!contextText) {
      return null;
    }

    return (
      <EditorBlockFrame
        blockId={block.id}
        blockType={block.type}
        onEdit={onEdit}
      >
        <Typography
          variant="body2"
          sx={(theme: Theme) => ({
            ...theme.typography.editorBody,
            fontStyle: "italic",
            color: theme.palette.editor.blockMuted,
          })}
        >
          {contextText}
        </Typography>
      </EditorBlockFrame>
    );
  }

  return (
    <EditorBlockFrame blockId={block.id} blockType={block.type} onEdit={onEdit}>
      <Typography
        variant="body2"
        sx={(theme: Theme) => ({
          ...theme.typography.editorBody,
          color: theme.palette.editor.blockMuted,
        })}
      >
        (Bloque de metadatos sin representación especializada)
      </Typography>
    </EditorBlockFrame>
  );
}
