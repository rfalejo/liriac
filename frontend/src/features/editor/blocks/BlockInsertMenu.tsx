import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { Theme } from "@mui/material/styles";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import SubjectRoundedIcon from "@mui/icons-material/SubjectRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import LandscapeRoundedIcon from "@mui/icons-material/LandscapeRounded";
import ContentPasteRoundedIcon from "@mui/icons-material/ContentPasteRounded";
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
  onOpenConversion?: (position: BlockInsertPosition) => void;
  conversionDisabled?: boolean;
  visible?: boolean;
  onRequestClose?: () => void;
};

export const BLOCK_INSERT_OPTIONS = [
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
  onOpenConversion,
  conversionDisabled = false,
  visible,
  onRequestClose,
}: BlockInsertMenuProps) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isTouchViewport = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("sm"),
  );

  const computedVisible = visible ?? (isTouchViewport || hovered || expanded);

  const handleToggle = useCallback(() => {
    setExpanded((current) => {
      const next = !current;
      if (!next) {
        onRequestClose?.();
      }
      return next;
    });
  }, [onRequestClose]);

  const handleLeave = useCallback(() => {
    setHovered(false);
    setExpanded(false);
    if (isTouchViewport) {
      onRequestClose?.();
    }
  }, [isTouchViewport, onRequestClose]);

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

      if (hovered) {
        return;
      }

      setExpanded(false);
      if (isTouchViewport) {
        onRequestClose?.();
      }
    },
    [hovered, isTouchViewport, onRequestClose],
  );

  useEffect(() => {
    if (visible === undefined) {
      return;
    }
    if (!visible) {
      setExpanded(false);
      setHovered(false);
      return;
    }
    if (isTouchViewport) {
      setExpanded(true);
    }
  }, [visible, isTouchViewport]);

  const optionButtons = useMemo(() => {
    const blockButtons = BLOCK_INSERT_OPTIONS.map(({ type, label, Icon }) => (
      <Tooltip key={type} title={label} placement="top" arrow>
        <IconButton
          size="small"
          onClick={() => {
            onInsertBlock?.(type, position);
            setExpanded(false);
            onRequestClose?.();
          }}
          aria-label={label}
          sx={(theme: Theme) => ({
            color: theme.palette.editor.blockMenuIcon,
            transition: theme.editor.iconButtonTransition,
            "&:hover": {
              backgroundColor: theme.palette.editor.blockMenuHoverBg,
              color: theme.palette.editor.blockMenuIconHover,
            },
          })}
        >
          <Icon fontSize="small" />
        </IconButton>
      </Tooltip>
    ));

    if (!onOpenConversion) {
      return blockButtons;
    }

    const conversionButton = (
      <Tooltip
        key="conversion"
        title="Pegar y convertir"
        placement="top"
        arrow
      >
        <span>
          <IconButton
            size="small"
            onClick={() => {
              if (conversionDisabled) {
                return;
              }
              onOpenConversion?.(position);
              setExpanded(false);
              onRequestClose?.();
            }}
            aria-label="Pegar y convertir"
            disabled={conversionDisabled}
            sx={(theme: Theme) => ({
              color: theme.palette.editor.blockMenuIcon,
              transition: theme.editor.iconButtonTransition,
              "&:hover": {
                backgroundColor: theme.palette.editor.blockMenuHoverBg,
                color: theme.palette.editor.blockMenuIconHover,
              },
              "&.Mui-disabled": {
                color: theme.palette.action.disabled,
              },
            })}
          >
            <ContentPasteRoundedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    );

    return [conversionButton, ...blockButtons];
  }, [conversionDisabled, onInsertBlock, onOpenConversion, position]);

  return (
    <Box
      data-editor-block-insert-menu="true"
      ref={containerRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
      sx={{
        width: "100%",
        minHeight:
          !isTouchViewport || computedVisible
            ? {
                xs: (theme) => theme.spacing(1.75),
                sm: (theme) => theme.spacing(2.25),
              }
            : 0,
        display:
          isTouchViewport && !computedVisible
            ? "none"
            : "grid",
        placeItems: "center",
        pointerEvents:
          isTouchViewport && !computedVisible ? "none" : "auto",
      }}
    >
      <Paper
        elevation={0}
        sx={(theme: Theme) => ({
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.5,
          px: expanded ? 1.25 : 0.75,
          py: 0.25,
          minHeight: theme.spacing(2),
          marginInline: "auto",
          borderRadius: 999,
          backgroundColor: expanded
            ? theme.palette.editor.blockHoverBg
            : "transparent",
          boxShadow: expanded
            ? `0 0 0 1px ${theme.palette.editor.blockHoverOutline}`
            : "none",
          transition:
            "background-color 160ms ease, box-shadow 160ms ease, padding 160ms ease",
          pointerEvents:
            isTouchViewport && !computedVisible ? "none" : "auto",
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
              opacity: computedVisible ? 0.96 : 0,
              transition: "opacity 160ms ease",
              color: theme.palette.editor.blockMenuTrigger,
              pointerEvents: computedVisible ? "auto" : "none",
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
