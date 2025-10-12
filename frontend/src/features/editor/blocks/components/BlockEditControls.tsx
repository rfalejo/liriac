import { CircularProgress, IconButton, Stack } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { editorBlockTheme } from "../../editorTheme";

type BlockEditControlsProps = {
  onConfirm?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
};

export function BlockEditControls({
  onConfirm,
  onCancel,
  disabled = false,
}: BlockEditControlsProps) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <IconButton
        size="small"
        color="success"
        onClick={() => {
          void onConfirm?.();
        }}
        disabled={disabled}
        aria-label="Guardar cambios"
        sx={editorBlockTheme.controls.confirmButton}
      >
        {disabled ? (
          <CircularProgress size={16} thickness={5} color="inherit" />
        ) : (
          <CheckRoundedIcon sx={{ fontSize: "1.1rem" }} />
        )}
      </IconButton>
      <IconButton
        size="small"
        color="error"
        onClick={() => {
          onCancel?.();
        }}
        disabled={disabled}
        aria-label="Cancelar edición"
        sx={editorBlockTheme.controls.cancelButton}
      >
        <CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />
      </IconButton>
    </Stack>
  );
}
