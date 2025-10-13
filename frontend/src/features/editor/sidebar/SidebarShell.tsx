import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

export type SidebarShellProps = {
  children: ReactNode;
  onEnter: () => void;
  onLeave: () => void;
  visible: boolean;
};

export function SidebarShell({
  children,
  onEnter,
  onLeave,
  visible,
}: SidebarShellProps) {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        display: "flex",
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      <Box
        role="presentation"
        tabIndex={0}
        aria-label="Mostrar navegación del libro"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocus={onEnter}
        onBlur={onLeave}
        sx={{
          width: 28,
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
          width: 280,
          height: "100%",
          pointerEvents: visible ? "auto" : "none",
          display: "flex",
        }}
      >
        <Stack
          spacing={2.5}
          sx={(theme: Theme) => ({
            width: "100%",
            height: "100%",
            px: 3,
            py: 3,
            bgcolor: theme.palette.editor.sidebarBg,
            borderRight: `1px solid ${theme.palette.editor.sidebarBorder}`,
            backdropFilter: "blur(14px)",
            color: theme.palette.editor.sidebarTextPrimary,
            transform: visible ? "translateX(0)" : "translateX(-32px)",
            opacity: visible ? 1 : 0,
            transition: "opacity 180ms ease, transform 240ms ease",
          })}
        >
          {children}
        </Stack>
      </Box>
    </Box>
  );
}
