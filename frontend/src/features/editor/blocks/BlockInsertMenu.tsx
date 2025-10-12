import { useCallback, useMemo, useRef, useState } from "react";
import { Box, IconButton, Paper, Tooltip } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import SubjectRoundedIcon from "@mui/icons-material/SubjectRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import LandscapeRoundedIcon from "@mui/icons-material/LandscapeRounded";
import type { FocusEventHandler } from "react";
import type { components } from "../../../api/schema";

type ChapterBlockType = components["schemas"]["ChapterBlockTypeEnum"];

export type BlockInsertPosition = {
  afterBlockId: string | null;
  beforeBlockId: string | null;
  index: number;
};

type BlockInsertMenuProps = {
  position: BlockInsertPosition;
  onInsertBlock?: (
    blockType: ChapterBlockType,
    position: BlockInsertPosition,
  ) => void;
};

const BLOCK_OPTIONS = [
  {
    type: "paragraph" as const,
    label: "Añadir párrafo",
    Icon: SubjectRoundedIcon,
  },
  {
    type: "dialogue" as const,
    label: "Añadir diálogo",
    Icon: ChatBubbleOutlineRoundedIcon,
  },
  {
    type: "scene_boundary" as const,
    label: "Añadir límite de escena",
    Icon: LandscapeRoundedIcon,
  },
  {
    type: "metadata" as const,
    label: "Añadir metadatos",
    Icon: InfoRoundedIcon,
  },
] satisfies Array<{
  type: ChapterBlockType;
  label: string;
  Icon: typeof SubjectRoundedIcon;
}>;

export function BlockInsertMenu({
  position,
  onInsertBlock,
}: BlockInsertMenuProps) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const visible = hovered || expanded;

  const handleToggle = useCallback(() => {
    setExpanded((current) => !current);
  }, []);

  const handleLeave = useCallback(() => {
    setHovered(false);
    setExpanded(false);
  }, []);

  const handleFocusCapture = useCallback(() => {
    setExpanded(true);
  }, []);

  const handleBlurCapture = useCallback<FocusEventHandler<HTMLDivElement>>(
    (event) => {
      const nextFocus = event.relatedTarget as Node | null;
      const root = containerRef.current;
      if (root && nextFocus && root.contains(nextFocus)) {
        return;
      }
      setExpanded(false);
    },
    [],
  );

  const optionButtons = useMemo(
    () =>
      BLOCK_OPTIONS.map(({ type, label, Icon }) => (
        <Tooltip key={type} title={label} placement="top" arrow>
          <IconButton
            size="small"
            onClick={() => {
              onInsertBlock?.(type, position);
              setExpanded(false);
            }}
            aria-label={label}
            sx={(theme: Theme) => ({
              color: theme.palette.editor.blockMenuIcon,
              transition: "background-color 140ms ease, color 140ms ease",
              "&:hover": {
                backgroundColor: theme.palette.editor.blockMenuHoverBg,
                color: theme.palette.editor.blockMenuIconHover,
              },
            })}
          >
            <Icon fontSize="small" />
          </IconButton>
        </Tooltip>
      )),
    [onInsertBlock, position],
  );

  return (
    <Box
      ref={containerRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
      sx={{
        width: "100%",
        height: {
          xs: (theme) => theme.spacing(2.5),
          sm: (theme) => theme.spacing(3),
        },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
      }}
    >
      <Paper
        elevation={0}
        sx={(theme: Theme) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.5,
          px: expanded ? 1.25 : 0.75,
          py: 0,
          minHeight: "100%",
          borderRadius: 999,
          backgroundColor: expanded
            ? theme.palette.editor.blockHoverBg
            : "transparent",
          boxShadow: expanded
            ? `0 0 0 1px ${theme.palette.editor.blockHoverOutline}`
            : "none",
          transition:
            "background-color 160ms ease, box-shadow 160ms ease, padding 160ms ease",
          pointerEvents: visible ? "auto" : "none",
        })}
      >
        {expanded ? (
          optionButtons
        ) : (
          <IconButton
            size="small"
            aria-label="Mostrar tipos de bloque disponibles"
            onClick={handleToggle}
            sx={(theme: Theme) => ({
              opacity: visible ? 0.96 : 0,
              transition: "opacity 160ms ease",
              color: theme.palette.editor.blockMenuTrigger,
              pointerEvents: visible ? "auto" : "none",
              "&:hover": {
                backgroundColor: theme.palette.editor.blockMenuHoverBg,
                color: theme.palette.editor.blockMenuTriggerHover,
              },
            })}
          >
            <MoreHorizRoundedIcon fontSize="small" />
          </IconButton>
        )}
      </Paper>
    </Box>
  );
}
