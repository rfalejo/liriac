import ListItemButton, {
  type ListItemButtonProps,
} from "@mui/material/ListItemButton";
import type { SxProps, Theme } from "@mui/material/styles";
import { forwardRef } from "react";

type LibraryListItemVariant = "default" | "stacked";

type LibraryListItemButtonProps = ListItemButtonProps & {
  variant?: LibraryListItemVariant;
  sx?: SxProps<Theme>;
};

const defaultVariantSx = (theme: Theme) => ({
  borderRadius: 2,
  mb: 1,
  alignItems: "flex-start",
  textAlign: "left",
  px: 2,
  py: 1.25,
  gap: 0.5,
  "&.Mui-selected": {
    backgroundColor: theme.palette.action.selected,
  },
  "&.Mui-selected:hover": {
    backgroundColor: theme.palette.action.selected,
  },
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
});

const stackedVariantSx = (theme: Theme) => ({
  ...defaultVariantSx(theme),
  flexDirection: "column",
  px: 2,
  py: 1.5,
  backgroundColor: "transparent",
  "&:last-of-type": {
    mb: 0,
  },
});

const variantStyles: Record<LibraryListItemVariant, SxProps<Theme>> = {
  default: defaultVariantSx,
  stacked: stackedVariantSx,
};

type SxArray = Extract<SxProps<Theme>, readonly unknown[]>;

const isSxArray = (value: SxProps<Theme>): value is SxArray =>
  Array.isArray(value);

export const LibraryListItemButton = forwardRef<
  HTMLDivElement,
  LibraryListItemButtonProps
>(({ variant = "default", sx, ...props }, ref) => {
  const baseSx = variantStyles[variant];

  let combinedSx: SxProps<Theme> = baseSx;
  if (sx) {
    combinedSx = isSxArray(sx)
      ? ([baseSx, ...sx] as SxProps<Theme>)
      : ([baseSx, sx] as SxProps<Theme>);
  }

  return <ListItemButton ref={ref} {...props} sx={combinedSx} />;
});

LibraryListItemButton.displayName = "LibraryListItemButton";
