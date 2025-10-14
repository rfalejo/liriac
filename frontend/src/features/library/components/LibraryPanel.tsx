import Box from "@mui/material/Box";
import Paper, { type PaperProps } from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { LibraryPanelStatus } from "./LibraryPanelStatus";
import type { LibraryPanelStatusProps } from "./LibraryPanelStatus";

type LibraryPanelProps = {
  title: string;
  status?: LibraryPanelStatusProps | null;
  children?: ReactNode;
  actions?: ReactNode;
} & PaperProps;

/**
 * Provides a common shell for library panels while handling shared status states.
 */
export function LibraryPanel({
  title,
  status = null,
  children,
  actions,
  elevation = 0,
  variant = "outlined",
  sx,
  ...paperProps
}: LibraryPanelProps) {
  const baseSx: SxProps<Theme> = (theme) => ({
    p: { xs: 2.25, md: 3 },
    backgroundColor: alpha(theme.palette.background.paper, 0.88),
    backgroundImage: `linear-gradient(165deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.74)} 100%)`,
    borderRadius: theme.spacing(2.5),
    border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
    boxShadow: `0 22px 40px ${alpha(theme.palette.common.black, 0.04)}`,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    height: "100%",
  });

  type SxArray = Extract<SxProps<Theme>, readonly unknown[]>;
  const isSxArray = (value: SxProps<Theme>): value is SxArray =>
    Array.isArray(value);

  const resolvedSx: SxProps<Theme> = (() => {
    if (!sx) {
      return baseSx;
    }

    if (isSxArray(sx)) {
      return [baseSx, ...sx] as SxProps<Theme>;
    }

    return [baseSx, sx] as SxProps<Theme>;
  })();

  return (
    <Paper
      elevation={elevation}
      variant={variant}
      {...paperProps}
      sx={resolvedSx}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography
          variant="overline"
          sx={{
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "text.secondary",
          }}
        >
          {title}
        </Typography>
        {actions ? <Box>{actions}</Box> : null}
      </Stack>
      {status ? <LibraryPanelStatus {...status} /> : children}
    </Paper>
  );
}
