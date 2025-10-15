import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import type { BlockVersionState } from "../../types";

type BlockEditControlsProps = {
  onConfirm?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  supportsSuggestions?: boolean;
  onRequestSuggestion?: () => void;
  suggestionPending?: boolean;
  suggestionDisabled?: boolean;
  versioning?: BlockVersionState;
};

export function BlockEditControls({
  onConfirm,
  onCancel,
  onDelete,
  disabled = false,
  supportsSuggestions = false,
  onRequestSuggestion,
  suggestionPending = false,
  suggestionDisabled = false,
  versioning,
}: BlockEditControlsProps) {
  const showSuggestionButton = supportsSuggestions && Boolean(onRequestSuggestion);
  const suggestionButtonDisabled =
    disabled || suggestionDisabled || suggestionPending;
  const versionControlsDisabled = disabled || versioning?.disabled;
  const versionDeleteDisabled =
    versionControlsDisabled || versioning?.deleteDisabled;

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {versioning ? (
        <Stack direction="row" spacing={0.25} alignItems="center">
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
          <Box
            sx={(theme: Theme) => ({
              minWidth: 36,
              px: 0.5,
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
                  ? `v${versioning.current}/${versioning.total}`
                  : "v—"}
              </Typography>
            )}
          </Box>
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
          {versioning.onDelete ? (
            <IconButton
              size="small"
              onClick={() => {
                if (versionDeleteDisabled) {
                  return;
                }
                versioning.onDelete?.();
              }}
              disabled={Boolean(versionDeleteDisabled)}
              aria-label="Eliminar versión"
              sx={(theme: Theme) => ({
                backgroundColor: theme.palette.editor.blockHoverBg,
                color: theme.palette.editor.blockIcon,
                transition: theme.editor.iconButtonTransition,
                "&:hover": {
                  backgroundColor: theme.palette.editor.controlDeleteHoverBg,
                  color: theme.palette.editor.blockIconHover,
                },
                "&.Mui-disabled": {
                  backgroundColor: theme.palette.editor.controlConfirmDisabledBg,
                  color: theme.palette.editor.controlGhostDisabledText,
                },
              })}
            >
              <DeleteOutlineRoundedIcon sx={{ fontSize: "1.1rem" }} />
            </IconButton>
          ) : null}
        </Stack>
      ) : null}
      {showSuggestionButton ? (
        <IconButton
          size="small"
          onClick={() => {
            if (suggestionPending) {
              return;
            }
            onRequestSuggestion?.();
          }}
          disabled={suggestionButtonDisabled}
          aria-label="Pedir sugerencia para este bloque"
          sx={(theme: Theme) => ({
            backgroundColor: theme.palette.editor.controlSuggestBg,
            transition: theme.editor.iconButtonTransition,
            color: theme.palette.editor.blockIcon,
            "&:hover": {
              backgroundColor: theme.palette.editor.controlSuggestHoverBg,
              color: theme.palette.editor.blockIconHover,
            },
            "&.Mui-disabled": {
              backgroundColor: theme.palette.editor.controlSuggestDisabledBg,
              color: theme.palette.editor.controlGhostDisabledText,
            },
          })}
        >
          {suggestionPending ? (
            <CircularProgress size={16} thickness={5} color="inherit" />
          ) : (
            <AutoFixHighRoundedIcon sx={{ fontSize: "1.1rem" }} />
          )}
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
