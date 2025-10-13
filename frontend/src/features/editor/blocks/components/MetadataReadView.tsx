import { Stack, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { components } from "../../../../api/schema";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type MetadataViewProps = {
  block: ChapterBlock;
};

type DetailLineProps = {
  term: string;
  value: string;
};

function DetailLine({ term, value }: DetailLineProps) {
  return (
    <Stack spacing={0.25} alignItems="flex-start">
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        {term}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

export function MetadataReadView({ block }: MetadataViewProps) {
  const kind = block.kind ?? "metadata";

  if (kind === "chapter_header") {
    const primaryHeading = block.title ?? block.subtitle;
    const shouldShowSupportingTitle = Boolean(
      block.subtitle && block.title && block.subtitle !== block.title,
    );

    return (
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
    );
  }

  if (kind === "context") {
    const contextText = block.context?.trim() ?? block.text?.trim();
    const narrative = block.narrativeContext;
    const pov = narrative?.povCharacterName ?? block.povCharacterName;
    const timeline = narrative?.timelineMarker ?? block.timelineMarker;
    const location =
      narrative?.locationName ??
      block.locationName ??
      narrative?.locationId ??
      block.locationId;
    const themeTags = narrative?.themeTags ?? block.themeTags ?? [];

    const hasDetails = Boolean(
      pov || timeline || location || themeTags.length > 0,
    );

    return (
      <Stack spacing={1} alignItems="flex-start">
        <Typography
          variant="body2"
          sx={(theme: Theme) => ({
            ...theme.typography.editorBody,
            fontStyle: "italic",
            color: theme.palette.editor.blockMuted,
          })}
        >
          {contextText && contextText.length > 0
            ? contextText
            : "(Sin contexto disponible)"}
        </Typography>

        {hasDetails && (
          <Stack spacing={0.75} alignItems="flex-start">
            {pov && <DetailLine term="Punto de vista" value={pov} />}
            {location && <DetailLine term="Ubicación" value={location} />}
            {timeline && <DetailLine term="Momento" value={timeline} />}
            {themeTags.length > 0 && (
              <DetailLine
                term="Temas"
                value={themeTags.filter(Boolean).join(", ")}
              />
            )}
          </Stack>
        )}
      </Stack>
    );
  }

  return (
    <Typography
      variant="body2"
      sx={(theme: Theme) => ({
        ...theme.typography.editorBody,
        color: theme.palette.editor.blockMuted,
      })}
    >
      {block.text && block.text.length > 0
        ? block.text
        : "(Bloque de metadatos sin contenido)"}
    </Typography>
  );
}
