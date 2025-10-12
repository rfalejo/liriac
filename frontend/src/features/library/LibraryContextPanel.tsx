import {
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { ContextItem, LibraryResponse } from "../../api/library";

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
  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Contexto
      </Typography>
      {loading && (
        <Stack
          spacing={2}
          alignItems="center"
          justifyContent="center"
          sx={{ py: 4 }}
        >
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Cargando contexto
          </Typography>
        </Stack>
      )}
      {!loading && error && (
        <Stack
          spacing={2}
          alignItems="center"
          textAlign="center"
          sx={{ py: 4 }}
        >
          <Typography variant="body2">
            No se pudo obtener el contexto.
          </Typography>
          <Button variant="contained" size="small" onClick={onReload}>
            Reintentar
          </Button>
        </Stack>
      )}
      {!loading && !error && sections.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Aún no hay elementos de contexto.
        </Typography>
      )}
      {!loading && !error && sections.length > 0 && (
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
    </Paper>
  );
}
