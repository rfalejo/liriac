import { useCallback, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import GlobalStyles from "@mui/material/GlobalStyles";
import { useTheme } from "@mui/material/styles";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import type { UseGeneralSuggestionResult } from "./useGeneralSuggestion";

const DRAWER_BLEEDING = 72;

type CopyFeedback = {
  type: "success" | "error";
  message: string;
};

type GeneralSuggestionDockProps = {
  suggestion: UseGeneralSuggestionResult;
  disabled?: boolean;
  isChapterSelected: boolean;
};

export function GeneralSuggestionDock({
  suggestion,
  disabled = false,
  isChapterSelected,
}: GeneralSuggestionDockProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback | null>(null);

  const isBusy = suggestion.requestPending || suggestion.applyPending;

  const trimmedPrompt = useMemo(() => prompt.trim(), [prompt]);

  const toggleDrawer = useCallback(
    (nextOpen: boolean) => () => {
      if (disabled && nextOpen) {
        return;
      }
      setOpen(nextOpen);
    },
    [disabled],
  );

  const handleSubmit = useCallback(async () => {
    try {
      await suggestion.submit({ prompt });
      setCopyFeedback(null);
    } catch {
      // Errors are handled inside the hook state. We clear feedback to avoid stale success messages.
      setCopyFeedback(null);
    }
  }, [prompt, suggestion]);

  const handleCopyPrompt = useCallback(async () => {
    try {
      const result = await suggestion.copyPrompt({ prompt });
      setCopyFeedback({ type: "success", message: result.message });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo copiar el prompt.";
      setCopyFeedback({ type: "error", message });
    }
  }, [prompt, suggestion]);

  const handleChangePrompt = useCallback(
    (value: string) => {
      setPrompt(value);
      if (suggestion.requestError) {
        suggestion.clearRequestError();
      }
      if (copyFeedback) {
        setCopyFeedback(null);
      }
    },
    [copyFeedback, suggestion],
  );

  return (
    <Box
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: theme.zIndex.snackbar + 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      {!disabled ? (
        <Box
          component="button"
          type="button"
          aria-label="Mostrar panel de sugerencias"
          onClick={() => setOpen(true)}
          sx={{
            position: "absolute",
            left: "50%",
            bottom: 12,
            transform: "translateX(-50%)",
            width: 200,
            height: DRAWER_BLEEDING - 24,
            border: 0,
            cursor: "pointer",
            backgroundColor: "transparent",
            opacity: 0,
            zIndex: 2,
          }}
        />
      ) : null}
      <GlobalStyles
        styles={{
          ".MuiDrawer-root > .MuiPaper-root.general-suggestion-dock": {
            height: `calc(100% - ${DRAWER_BLEEDING}px)`,
            maxHeight: 440,
            overflow: "visible",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: theme.palette.background.paper,
            boxShadow: "0 20px 44px rgba(15, 23, 42, 0.28)",
            width: "100%",
            margin: "0 auto",
          },
        }}
      />
      <SwipeableDrawer
        anchor="bottom"
        open={open && !disabled}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        swipeAreaWidth={disabled ? 0 : DRAWER_BLEEDING}
        disableSwipeToOpen={disabled}
        ModalProps={{
          keepMounted: true,
        }}
        slotProps={{
          paper: {
            className: "general-suggestion-dock",
            sx: {
              maxWidth: 720,
            },
          },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 44,
            height: 4,
            borderRadius: 999,
            backgroundColor: "rgba(15, 23, 42, 0.24)",
          }}
        />
        <Box
          sx={{
            px: { xs: 2.5, sm: 3.5 },
            pt: { xs: 6, sm: 7 },
            pb: { xs: 3, sm: 4 },
            mx: "auto",
            width: "100%",
            maxWidth: 640,
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
          }}
        >
          <Stack spacing={1.25}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Generar sugerencias
            </Typography>
            <Typography
              variant="body2"
              sx={(themeStyles) => ({
                color: themeStyles.palette.text.secondary,
              })}
            >
              Describe qué necesitas y la IA propondrá hasta tres bloques coherentes con el capítulo.
            </Typography>
          </Stack>

          {!isChapterSelected ? (
            <Alert severity="info">
              Selecciona un capítulo para generar sugerencias.
            </Alert>
          ) : null}

          {suggestion.requestError ? (
            <Alert
              severity="error"
              onClose={() => {
                suggestion.clearRequestError();
              }}
            >
              {suggestion.requestError}
            </Alert>
          ) : null}

          {copyFeedback ? (
            <Alert
              severity={copyFeedback.type === "success" ? "success" : "warning"}
              onClose={() => setCopyFeedback(null)}
            >
              {copyFeedback.message}
            </Alert>
          ) : null}

          <TextField
            value={prompt}
            onChange={(event) => handleChangePrompt(event.target.value)}
            placeholder="Cuenta qué parte del capítulo quieres reforzar o añadir"
            multiline
            minRows={4}
            maxRows={8}
            disabled={isBusy || !isChapterSelected}
            autoFocus={false}
            sx={{ mt: 0.5 }}
          />

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography
              variant="caption"
              sx={(themeStyles) => ({
                color: themeStyles.palette.text.secondary,
              })}
            >
              Se insertarán los bloques al final del capítulo.
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton
                size="small"
                onClick={() => {
                  void handleCopyPrompt();
                }}
                disabled={
                  !isChapterSelected ||
                  !trimmedPrompt ||
                  isBusy ||
                  disabled
                }
                aria-label="Copiar prompt generado"
              >
                <ContentCopyRoundedIcon fontSize="small" />
              </IconButton>
              <Button
                variant="contained"
                startIcon={<SendRoundedIcon fontSize="small" />}
                onClick={() => {
                  void handleSubmit();
                }}
                disabled={
                  !isChapterSelected ||
                  !trimmedPrompt ||
                  isBusy ||
                  disabled
                }
              >
                {suggestion.requestPending ? "Generando…" : "Enviar"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </SwipeableDrawer>
    </Box>
  );
}
