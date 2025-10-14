import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type { ReactNode } from "react";

export type HoverableSidePanelProps = {
  side: "left" | "right";
  title: string;
  visible: boolean;
  pinned: boolean;
  onTogglePin: () => void;
  onClose: () => void;
  onEnter: () => void;
  onLeave: () => void;
  width?: number;
  triggerWidth?: number;
  children: ReactNode;
};

const panelContentSx = (theme: Theme) => ({
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2.5),
  px: theme.spacing(3),
  py: theme.spacing(3),
  bgcolor: theme.palette.editor.sidebarBg,
  color: theme.palette.editor.sidebarTextPrimary,
  backdropFilter: "blur(14px)",
});

export function HoverableSidePanel({
  side,
  title,
  visible,
  pinned,
  onTogglePin,
  onClose,
  onEnter,
  onLeave,
  width = 320,
  triggerWidth = 28,
  children,
}: HoverableSidePanelProps) {
  const isLeft = side === "left";

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        bottom: 0,
        [side]: 0,
        display: "flex",
        flexDirection: isLeft ? "row" : "row-reverse",
        pointerEvents: "none",
        zIndex: 4,
      }}
    >
      <Box
        role="presentation"
        tabIndex={0}
        aria-label={
          isLeft
            ? "Mostrar panel de capítulos"
            : "Mostrar configuración de contexto"
        }
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocus={onEnter}
        onBlur={onLeave}
        sx={{
          width: triggerWidth,
          height: "100%",
          pointerEvents: "auto",
          outline: "none",
        }}
      />
      <Box
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocusCapture={onEnter}
        onBlurCapture={onLeave}
        sx={{
          width,
          height: "100%",
          pointerEvents: visible ? "auto" : "none",
          display: "flex",
        }}
      >
        <Stack
          sx={(theme: Theme) => ({
            ...panelContentSx(theme),
            borderRight: isLeft
              ? `1px solid ${theme.palette.editor.sidebarBorder}`
              : "none",
            borderLeft: !isLeft
              ? `1px solid ${theme.palette.editor.sidebarBorder}`
              : "none",
            transform: visible
              ? "translateX(0)"
              : `translateX(${isLeft ? "-32px" : "32px"})`,
            opacity: visible ? 1 : 0,
            transition: "opacity 180ms ease, transform 240ms ease",
          })}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography
              component="h2"
              variant="subtitle2"
              sx={(theme: Theme) => ({
                flex: 1,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: theme.palette.editor.sidebarHeading,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              })}
            >
              {title}
            </Typography>
            <Tooltip title={pinned ? "Desanclar panel" : "Anclar panel"}>
              <IconButton
                size="small"
                color="inherit"
                onClick={onTogglePin}
                sx={(theme: Theme) => ({
                  color: pinned
                    ? theme.palette.editor.sidebarButtonHover
                    : theme.palette.editor.sidebarButton,
                  transition: "color 180ms ease",
                  "&:hover": {
                    color: theme.palette.editor.sidebarButtonHover,
                    backgroundColor: "transparent",
                  },
                })}
              >
                {pinned ? (
                  <PushPinRoundedIcon fontSize="small" />
                ) : (
                  <PushPinOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Ocultar panel">
              <IconButton
                size="small"
                color="inherit"
                onClick={onClose}
                sx={(theme: Theme) => ({
                  color: theme.palette.editor.sidebarButton,
                  transition: "color 180ms ease",
                  "&:hover": {
                    color: theme.palette.editor.sidebarButtonHover,
                    backgroundColor: "transparent",
                  },
                })}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>{children}</Box>
        </Stack>
      </Box>
    </Box>
  );
}
