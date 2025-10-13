import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";

type BookDeleteDialogProps = {
  open: boolean;
  bookTitle: string;
  confirmationValue: string;
  errorMessage: string | null;
  disabled: boolean;
  onChangeConfirmation: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function BookDeleteDialog({
  open,
  bookTitle,
  confirmationValue,
  errorMessage,
  disabled,
  onChangeConfirmation,
  onClose,
  onSubmit,
}: BookDeleteDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle>Eliminar libro</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <DialogContentText>
              Esta acción no se puede deshacer. Escribe el título del libro para
              confirmar.
            </DialogContentText>
            <DialogContentText sx={{ fontWeight: 500 }}>
              "{bookTitle}"
            </DialogContentText>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            <TextField
              label="Título del libro"
              value={confirmationValue}
              onChange={(event) => onChangeConfirmation(event.target.value)}
              placeholder={bookTitle}
              autoFocus
              disabled={disabled}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={disabled}>
            Cancelar
          </Button>
          <Button
            type="submit"
            color="error"
            variant="contained"
            disabled={
              disabled || confirmationValue.trim() !== bookTitle.trim()
            }
          >
            Eliminar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
