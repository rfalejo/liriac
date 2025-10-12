import { Button, CircularProgress, Stack, Typography } from "@mui/material";

type LibraryPanelStatusProps = {
  state: "loading" | "error" | "empty";
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  centered?: boolean;
};

export function LibraryPanelStatus({
  state,
  message,
  actionLabel,
  onAction,
  centered = false,
}: LibraryPanelStatusProps) {
  const alignItems = centered ? "center" : "flex-start";
  const textAlign = centered ? "center" : "left";
  const spacing = state === "empty" && !centered ? 1 : 2;

  return (
    <Stack
      spacing={spacing}
      alignItems={alignItems}
      justifyContent={centered ? "center" : "flex-start"}
      textAlign={textAlign}
      sx={{ py: 4 }}
    >
      {state === "loading" && <CircularProgress size={20} />}
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
      {state === "error" && actionLabel && onAction && (
        <Button variant="contained" size="small" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
}
