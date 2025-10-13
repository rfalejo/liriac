import { Box, Paper, Stack, Typography } from "@mui/material";
import type { PaperProps } from "@mui/material";
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
  const extraSx = Array.isArray(sx)
    ? (sx as SxProps<Theme>[])
    : sx
    ? ([sx] as SxProps<Theme>[])
    : [];

  const resolvedSx: SxProps<Theme> = extraSx.length
    ? ([{ p: 3 }, ...extraSx] as SxProps<Theme>)
    : ({ p: 3 } as SxProps<Theme>);

  return (
    <Paper
      elevation={elevation}
      variant={variant}
      {...paperProps}
      sx={resolvedSx}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        mb={2}
      >
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        {actions ? <Box>{actions}</Box> : null}
      </Stack>
      {status ? <LibraryPanelStatus {...status} /> : children}
    </Paper>
  );
}
