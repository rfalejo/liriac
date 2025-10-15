import { useMemo } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

export type BlockConversionDialogProps = {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
  disabled?: boolean;
  error?: string | null;
  onClearError?: () => void;
  canSubmit?: boolean;
};

export function BlockConversionDialog({
  open,
  value,
  onChange,
  onClose,
  onSubmit,
  submitting,
  disabled = false,
  error,
  onClearError,
  canSubmit,
}: BlockConversionDialogProps) {
  const resolvedCanSubmit = useMemo(
    () =>
      typeof canSubmit === "boolean"
        ? canSubmit && !submitting && !disabled
        : value.trim().length > 0 && !submitting && !disabled,
    [canSubmit, value, submitting, disabled],
  );

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!submitting) {
          onClose();
        }
      }}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>Convertir texto en bloques</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <TextField
            multiline
            minRows={8}
            maxRows={16}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Pega aquí el texto que quieres convertir"
            disabled={submitting || disabled}
            autoFocus
            onFocus={() => onClearError?.()}
          />
          {error ? (
            <Alert severity="error" onClose={onClearError}>
              {error}
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={!resolvedCanSubmit}
        >
          {submitting ? "Convirtiendo…" : "Convertir"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
