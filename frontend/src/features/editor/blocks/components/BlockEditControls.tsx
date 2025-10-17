import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import type { BlockVersionState } from "../../types";

type BlockEditControlsProps = {
  onConfirm?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  versioning?: BlockVersionState;
};

export function BlockEditControls({
  onConfirm,
  onCancel,
  onDelete,
  disabled = false,
  versioning,
}: BlockEditControlsProps) {
  const versionControlsDisabled = disabled || versioning?.disabled;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={(theme: Theme) => ({
        padding: theme.spacing(0.25, 0.75),
        borderRadius: 999,
        backgroundColor: theme.palette.editor.blockHoverBg,
        boxShadow: `inset 0 0 0 1px ${theme.palette.editor.blockHoverOutline}`,
      })}
    >
      {versioning ? (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box
            sx={(theme: Theme) => ({
              minWidth: 36,
              px: 1,
              py: 0.25,
              borderRadius: 999,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: theme.palette.editor.blockHoverBg,
              color: theme.palette.editor.blockIcon,
            })}
            aria-label="Versión seleccionada"
          >
            {versioning.loading ? (
              <CircularProgress size={12} thickness={5} color="inherit" />
            ) : (
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {versioning.current != null
                  ? `${versioning.current}/${versioning.total}`
                  : "—"}
              </Typography>
            )}
          </Box>
          <IconButton
            size="small"
            onClick={() => {
              if (versionControlsDisabled || !versioning.canGoPrevious) {
                return;
              }
              versioning.onPrevious();
            }}
            disabled={versionControlsDisabled || !versioning.canGoPrevious}
            aria-label="Cambiar a la versión anterior"
            sx={(theme: Theme) => ({
              backgroundColor: theme.palette.editor.blockHoverBg,
              color: theme.palette.editor.blockIcon,
              transition: theme.editor.iconButtonTransition,
              "&:hover": {
                backgroundColor: theme.palette.editor.blockActiveBg,
                color: theme.palette.editor.blockIconHover,
              },
              "&.Mui-disabled": {
                backgroundColor: theme.palette.editor.controlConfirmDisabledBg,
                color: theme.palette.editor.controlGhostDisabledText,
              },
            })}
          >
            <ChevronLeftRoundedIcon sx={{ fontSize: "1.1rem" }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              if (versionControlsDisabled || !versioning.canGoNext) {
                return;
              }
              versioning.onNext();
            }}
            disabled={versionControlsDisabled || !versioning.canGoNext}
            aria-label="Cambiar a la versión siguiente"
            sx={(theme: Theme) => ({
              backgroundColor: theme.palette.editor.blockHoverBg,
              color: theme.palette.editor.blockIcon,
              transition: theme.editor.iconButtonTransition,
              "&:hover": {
                backgroundColor: theme.palette.editor.blockActiveBg,
                color: theme.palette.editor.blockIconHover,
              },
              "&.Mui-disabled": {
                backgroundColor: theme.palette.editor.controlConfirmDisabledBg,
                color: theme.palette.editor.controlGhostDisabledText,
              },
            })}
          >
            <ChevronRightRoundedIcon sx={{ fontSize: "1.1rem" }} />
          </IconButton>
        </Stack>
      ) : null}
      {onDelete ? (
        <IconButton
          size="small"
          onClick={() => {
            onDelete();
          }}
          disabled={disabled}
          aria-label="Eliminar bloque"
          sx={(theme: Theme) => ({
            backgroundColor: theme.palette.editor.blockHoverBg,
            transition: theme.editor.iconButtonTransition,
            color: theme.palette.editor.blockIcon,
            "&:hover": {
              backgroundColor: theme.palette.editor.blockActiveBg,
              color: theme.palette.editor.blockIconHover,
            },
            "&.Mui-disabled": {
              backgroundColor: theme.palette.editor.controlConfirmDisabledBg,
              color: theme.palette.editor.controlGhostDisabledText,
            },
          })}
        >
          <DeleteRoundedIcon sx={{ fontSize: "1.1rem" }} />
        </IconButton>
      ) : null}
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
    </Stack>
  );
}
