import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: "warning" | "danger";
  onClose: (confirmed: boolean) => void;
  confirmDisabled?: boolean;
};

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "warning",
  onClose,
  confirmDisabled = false,
}: ConfirmationDialogProps) {
  const confirmColor = tone === "danger" ? "error" : "warning";

  return (
    <Dialog
      open={open}
      onClose={() => {
        onClose(false);
      }}
      aria-labelledby="editor-confirmation-dialog-title"
      aria-describedby="editor-confirmation-dialog-description"
    >
      <DialogTitle id="editor-confirmation-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText
          id="editor-confirmation-dialog-description"
          sx={(theme: Theme) => ({
            color: theme.palette.editor.blockMuted,
          })}
        >
          {description}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={() => {
            onClose(false);
          }}
        >
          {cancelLabel}
        </Button>
        <Button
          color={confirmColor}
          variant="contained"
          onClick={() => {
            onClose(true);
          }}
          disabled={confirmDisabled}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
