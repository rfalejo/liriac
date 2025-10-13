import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { alpha } from "@mui/material/styles";
import type {
  ContextItem,
  ContextSection,
  LibraryResponse,
} from "../../api/library";

export type LibraryContextDialogProps = {
  open: boolean;
  sections: LibraryResponse["sections"];
  loading: boolean;
  error: Error | null;
  onReload: () => void;
  onClose: () => void;
};

function getItemPrimaryText(item: ContextItem) {
  return item.title ?? item.name ?? "Sin título";
}

function getItemSecondaryText(item: ContextItem) {
  return item.summary ?? item.description ?? item.facts ?? undefined;
}

export function LibraryContextDialog({
  open,
  sections,
  loading,
  error,
  onReload,
  onClose,
}: LibraryContextDialogProps) {
  const showEmpty = !loading && !error && sections.length === 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          elevation: 0,
          sx: (theme) => ({
            borderRadius: theme.spacing(1.5),
            backgroundColor: alpha(theme.palette.background.paper, 0.98),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
            boxShadow: `0 28px 60px ${alpha(theme.palette.common.black, 0.18)}`,
          }),
        },
      }}
    >
      <DialogTitle sx={{ pb: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography variant="overline" sx={{ letterSpacing: "0.18em" }}>
              Contexto
            </Typography>
            <Typography variant="h6">Referencias clave</Typography>
          </Stack>
          <IconButton onClick={onClose} aria-label="Cerrar" size="small">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ px: { xs: 2.5, md: 4 }, py: { xs: 3, md: 4 } }}>
        {loading ? (
          <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ py: 6 }}>
            <CircularProgress size={22} />
            <Typography variant="body2" color="text.secondary">
              Cargando contexto
            </Typography>
          </Stack>
        ) : null}

        {!loading && error ? (
          <Stack spacing={2} alignItems="flex-start" sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No se pudo obtener el contexto.
            </Typography>
            <Button variant="contained" size="small" onClick={onReload}>
              Reintentar
            </Button>
          </Stack>
        ) : null}

        {showEmpty ? (
          <Typography variant="body2" color="text.secondary">
            Aún no hay elementos de contexto.
          </Typography>
        ) : null}

        {!loading && !error && sections.length > 0 ? (
          <Stack spacing={3}>
            {sections.map((section: ContextSection) => (
              <Stack key={section.id} spacing={1.5}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {section.title}
                </Typography>
                <List disablePadding>
                  {section.items.map((item: ContextItem) => (
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
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2.5, md: 4 }, py: 2.5 }}>
        <Button onClick={onClose} color="inherit">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
