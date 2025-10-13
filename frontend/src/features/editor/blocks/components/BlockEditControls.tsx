import { CircularProgress, IconButton, Stack } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";

type BlockEditControlsProps = {
  onConfirm?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
};

export function BlockEditControls({
  onConfirm,
  onCancel,
  onDelete,
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
        sx={(theme: Theme) => ({
          backgroundColor: theme.palette.editor.controlConfirmBg,
          transition: theme.editor.iconButtonTransition,
          "&:hover": {
            backgroundColor: theme.palette.editor.controlConfirmHoverBg,
          },
          "&.Mui-disabled": {
            backgroundColor: theme.palette.editor.controlConfirmDisabledBg,
            color: theme.palette.editor.controlGhostDisabledText,
          },
        })}
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
        sx={(theme: Theme) => ({
          backgroundColor: theme.palette.editor.controlCancelBg,
          transition: theme.editor.iconButtonTransition,
          "&:hover": {
            backgroundColor: theme.palette.editor.controlCancelHoverBg,
          },
          "&.Mui-disabled": {
            backgroundColor: theme.palette.editor.controlCancelDisabledBg,
            color: theme.palette.editor.controlGhostDisabledText,
          },
        })}
      >
        <CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />
      </IconButton>
      {onDelete ? (
        <IconButton
          size="small"
          color="error"
          onClick={() => {
            onDelete();
          }}
          disabled={disabled}
          aria-label="Eliminar bloque"
          sx={(theme: Theme) => ({
            backgroundColor: theme.palette.editor.controlDeleteBg,
            transition: theme.editor.iconButtonTransition,
            "&:hover": {
              backgroundColor: theme.palette.editor.controlDeleteHoverBg,
            },
            "&.Mui-disabled": {
              backgroundColor: theme.palette.editor.controlDeleteDisabledBg,
              color: theme.palette.editor.controlGhostDisabledText,
            },
          })}
        >
          <DeleteRoundedIcon sx={{ fontSize: "1.1rem" }} />
        </IconButton>
      ) : null}
    </Stack>
  );
}
