import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
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
  condensed?: boolean;
};

type AddBookCardProps = {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  condensed?: boolean;
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
  condensed?: boolean;
};

const cardShellStyles =
  ({ selected, disabled, variant = "default", condensed }: CardShellOptions) =>
  (theme: Theme) => {
    const isAdd = variant === "add";
    const primary = theme.palette.primary.main;
    const borderColor = selected
      ? alpha(primary, 0.45)
      : alpha(theme.palette.text.primary, isAdd ? 0.2 : 0.12);
    const backgroundColor = isAdd
      ? alpha(primary, 0.06)
      : alpha(theme.palette.background.paper, 0.86);
    const restingShadow = isAdd
      ? `0 0 0 1px ${alpha(primary, 0.18)}`
      : selected
        ? `0 18px 36px ${alpha(primary, 0.16)}`
        : `0 14px 32px ${alpha(theme.palette.common.black, 0.05)}`;
    const hoverShadow = isAdd
      ? `0 0 0 1px ${alpha(primary, 0.26)}`
      : `0 22px 40px ${alpha(theme.palette.common.black, 0.08)}`;

    return {
      position: "relative" as const,
      width: "100%",
      padding: theme.spacing(condensed ? 1.75 : 2.25),
      borderRadius: theme.spacing(2),
      border: `1px ${isAdd ? "dashed" : "solid"} ${borderColor}`,
      borderColor,
      backgroundColor,
      boxShadow: restingShadow,
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
              transform: "translateY(-3px)",
              boxShadow: hoverShadow,
            },
          }),
      "&:focus-visible, &:focus-within": {
        outline: `2px solid ${alpha(primary, 0.6)}`,
        outlineOffset: 4,
      },
    };
  };

const cardButtonStyles: SxProps<Theme> = {
  display: "block",
  width: "100%",
  textAlign: "left",
};

const coverVisualStyles = (condensed: boolean): SxProps<Theme> =>
  (theme: Theme) => ({
    position: "relative" as const,
    width: condensed ? 72 : "100%",
    height: condensed ? 104 : "auto",
    borderRadius: theme.spacing(condensed ? 1.5 : 2.25),
    overflow: "hidden",
    background: `radial-gradient(circle at 20% 20%, ${alpha(theme.palette.primary.main, 0.22)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 70%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.common.black, 0.04)}`,
    aspectRatio: condensed ? undefined : "2 / 3",
    flexShrink: condensed ? 0 : undefined,
    alignSelf: condensed ? "stretch" : undefined,
  });

const coverLetterStyles: SxProps<Theme> = (theme: Theme) => ({
  position: "absolute" as const,
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "2.25rem",
  fontWeight: 600,
  letterSpacing: "0.06em",
  color: alpha(theme.palette.text.primary, 0.55),
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
  condensed = false,
}: BookCoverCardProps) {
  const initial = title.trim().charAt(0).toUpperCase() || "B";
  const chapterLabel = `${chaptersCount} ${chaptersCount === 1 ? "capítulo" : "capítulos"}`;

  return (
    <Box sx={cardShellStyles({ selected, disabled, condensed })}>
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
        <Stack
          spacing={condensed ? 1.5 : 2.25}
          alignItems={condensed ? "center" : "stretch"}
          direction={condensed ? "row" : "column"}
        >
          <Box sx={coverVisualStyles(condensed)}>
            <Box sx={coverLetterStyles}>{initial}</Box>
          </Box>
          <Stack
            spacing={condensed ? 0.5 : 0.75}
            alignItems="flex-start"
            sx={{ flex: 1, minWidth: 0 }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                lineHeight: 1.2,
                display: "-webkit-box",
                WebkitLineClamp: condensed ? 1 : 2,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
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
            {synopsis && !condensed ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  ...synopsisClampSx,
                  WebkitLineClamp: condensed ? 1 : 2,
                }}
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
              backgroundColor: alpha(theme.palette.background.paper, 0.76),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.24)}`,
              boxShadow: `0 8px 16px ${alpha(theme.palette.common.black, 0.08)}`,
              zIndex: 1,
              "&:hover": {
                backgroundColor: alpha(theme.palette.background.paper, 0.92),
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
  condensed = false,
}: AddBookCardProps) {
  return (
    <Box
      sx={cardShellStyles({
        selected: false,
        disabled,
        variant: "add",
        condensed,
      })}
    >
      <ButtonBase
        onClick={onClick}
        disableRipple
        disabled={disabled}
        sx={{
          ...cardButtonStyles,
          height: "100%",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={condensed ? 1 : 1.25}
        >
          <Box
            sx={(theme) => ({
              width: condensed ? 32 : 40,
              height: condensed ? 32 : 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: alpha(theme.palette.primary.main, 0.14),
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
