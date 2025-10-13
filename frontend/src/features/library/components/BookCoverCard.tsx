import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import {
  Box,
  ButtonBase,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";

export type BookCoverCardProps = {
  title: string;
  author?: string | null;
  synopsis?: string | null;
  chaptersCount: number;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
};

type AddBookCardProps = {
  onClick: () => void;
  disabled?: boolean;
  label: string;
};

const synopsisClampSx: SxProps<Theme> = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical" as const,
  overflow: "hidden",
};

type CardShellOptions = {
  selected?: boolean;
  disabled?: boolean;
  variant?: "default" | "add";
};

const cardShellStyles = ({
  selected,
  disabled,
  variant = "default",
}: CardShellOptions) =>
  (theme: Theme) => {
    const isAdd = variant === "add";
    const primary = theme.palette.primary.main;
    const baseBorder = isAdd
      ? `1px dashed ${alpha(primary, 0.35)}`
      : "1px solid";
    const borderColor = isAdd
      ? alpha(primary, 0.35)
      : selected
        ? alpha(primary, 0.4)
        : alpha(theme.palette.common.black, 0.08);
    const backgroundColor = isAdd
      ? alpha(primary, 0.04)
      : selected
        ? alpha(primary, 0.08)
        : theme.palette.background.paper;
    const boxShadow = isAdd
      ? "none"
      : selected
        ? `0 6px 18px ${alpha(primary, 0.18)}`
        : `0 4px 12px ${alpha(theme.palette.common.black, 0.06)}`;

    return {
      position: "relative" as const,
      width: "100%",
      padding: theme.spacing(2.5),
      borderRadius: theme.shape.borderRadius,
      border: baseBorder,
      borderColor,
      backgroundColor,
      boxShadow,
      transition: theme.transitions.create([
        "transform",
        "box-shadow",
        "border-color",
        "background-color",
      ]),
      textAlign: "left" as const,
      alignItems: "stretch",
      height: "100%",
      cursor: disabled ? "default" : "pointer",
      display: "flex",
      flexDirection: "column",
      transform: "translateY(0)",
      ...(disabled
        ? { opacity: 0.8 }
        : {
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: isAdd
                ? "none"
                : `0 10px 24px ${alpha(theme.palette.common.black, 0.12)}`,
            },
          }),
      "&:focus-within": {
        outline: `2px solid ${primary}`,
        outlineOffset: 2,
      },
    };
  };

const cardButtonStyles: SxProps<Theme> = {
  display: "block",
  width: "100%",
  textAlign: "left",
};

const coverVisualStyles: SxProps<Theme> = (theme: Theme) => ({
  position: "relative" as const,
  width: "100%",
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.28)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
  aspectRatio: "2 / 3",
  boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.common.black, 0.06)}`,
});

const coverLetterStyles: SxProps<Theme> = (theme: Theme) => ({
  position: "absolute" as const,
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "2.2rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  color: alpha(theme.palette.common.black, 0.5),
});

export function BookCoverCard({
  title,
  author,
  synopsis,
  chaptersCount,
  selected,
  disabled,
  onSelect,
  onEdit,
}: BookCoverCardProps) {
  const initial = title.trim().charAt(0).toUpperCase() || "B";
  const chapterLabel = `${chaptersCount} ${chaptersCount === 1 ? "capítulo" : "capítulos"}`;

  return (
    <Box sx={cardShellStyles({ selected, disabled })}>
      <ButtonBase
        onClick={() => {
          if (onSelect) {
            onSelect();
          }
        }}
        disableRipple
        disabled={disabled}
        sx={cardButtonStyles}
      >
        <Stack spacing={2} alignItems="stretch">
          <Box sx={coverVisualStyles}>
            <Box sx={coverLetterStyles}>{initial}</Box>
          </Box>
          <Stack spacing={0.75} alignItems="flex-start">
            <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.2 }}>
              {title}
            </Typography>
            {author ? (
              <Typography variant="body2" color="text.secondary">
                {author}
              </Typography>
            ) : null}
            <Typography variant="caption" color="text.secondary">
              {chapterLabel}
            </Typography>
            {synopsis ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={synopsisClampSx}
              >
                {synopsis}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      </ButtonBase>
      {onEdit ? (
        <Tooltip title="Editar" placement="left">
          <IconButton
            size="small"
            aria-label="Editar libro"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              onEdit?.();
            }}
            sx={(theme) => ({
              position: "absolute",
              top: theme.spacing(1.5),
              right: theme.spacing(1.5),
              color: theme.palette.primary.main,
              backgroundColor: alpha(theme.palette.common.white, 0.72),
              zIndex: 1,
              "&:hover": {
                backgroundColor: alpha(theme.palette.common.white, 0.92),
              },
            })}
          >
            <EditRoundedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
  );
}

export function AddBookCoverCard({
  onClick,
  disabled,
  label,
}: AddBookCardProps) {
  return (
    <Box sx={cardShellStyles({ selected: false, disabled, variant: "add" })}>
      <ButtonBase
        onClick={onClick}
        disableRipple
        disabled={disabled}
        sx={{ ...cardButtonStyles, height: "100%" }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={(theme) => ({
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
            })}
          >
            <AddRoundedIcon />
          </Box>
          <Stack spacing={0.5} alignItems="flex-start">
            <Typography variant="subtitle1" fontWeight={600}>
              {label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Añade un nuevo libro a tu biblioteca.
            </Typography>
          </Stack>
        </Stack>
      </ButtonBase>
    </Box>
  );
}
