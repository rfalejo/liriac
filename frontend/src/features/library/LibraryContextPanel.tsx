import { List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import type { ContextItem, LibraryResponse } from "../../api/library";
import { LibraryPanel } from "./components/LibraryPanel";
import type { LibraryPanelStatusProps } from "./components/LibraryPanelStatus";

type LibraryContextPanelProps = {
  sections: LibraryResponse["sections"];
  loading: boolean;
  error: Error | null;
  onReload: () => void;
};

function getItemPrimaryText(item: ContextItem) {
  return item.title ?? item.name ?? "Sin título";
}

function getItemSecondaryText(item: ContextItem) {
  return item.summary ?? item.description ?? item.facts ?? undefined;
}

export function LibraryContextPanel({
  sections,
  loading,
  error,
  onReload,
}: LibraryContextPanelProps) {
  const status: LibraryPanelStatusProps | null = (() => {
    if (loading) {
      return {
        state: "loading",
        message: "Cargando contexto",
        centered: true,
      };
    }

    if (error) {
      return {
        state: "error",
        message: "No se pudo obtener el contexto.",
        actionLabel: "Reintentar",
        onAction: onReload,
        centered: true,
      };
    }

    if (sections.length === 0) {
      return {
        state: "empty",
        message: "Aún no hay elementos de contexto.",
      };
    }

    return null;
  })();

  const showSections = !status && sections.length > 0;

  return (
    <LibraryPanel title="Contexto" status={status}>
      {showSections && (
        <Stack spacing={3}>
          {sections.map((section) => (
            <Stack key={section.id} spacing={1.5}>
              <Typography variant="body2" fontWeight={600}>
                {section.title}
              </Typography>
              <List disablePadding>
                {section.items.map((item) => (
                  <ListItem
                    key={item.id}
                    disableGutters
                    sx={{
                      py: 1,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      "&:last-of-type": {
                        borderBottom: "none",
                      },
                    }}
                  >
                    <ListItemText
                      primary={getItemPrimaryText(item)}
                      secondary={getItemSecondaryText(item)}
                      slotProps={{
                        primary: { variant: "body2" },
                        secondary: {
                          variant: "caption",
                          color: "text.secondary",
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Stack>
          ))}
        </Stack>
      )}
    </LibraryPanel>
  );
}
