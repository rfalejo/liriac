import { Box, IconButton } from "@mui/material";
import {
  type FocusEventHandler,
  type MouseEventHandler,
  type PointerEventHandler,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import type { components } from "../../../api/schema";

const BUTTON_OPACITY_VISIBLE = 1;
const BUTTON_OPACITY_HIDDEN = 0;

type ChapterBlockType = components["schemas"]["ChapterBlockTypeEnum"];

type PreviewBlockFrameProps = {
  blockId: string;
  blockType: ChapterBlockType;
  onEdit: (blockId: string) => void;
  children: ReactNode;
};

export function PreviewBlockFrame({
  blockId,
  blockType,
  onEdit,
  children,
}: PreviewBlockFrameProps) {
  const [focusWithin, setFocusWithin] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [touchRevealed, setTouchRevealed] = useState(false);

  const showControls = useMemo(
    () => focusWithin || hovered || touchRevealed,
    [focusWithin, hovered, touchRevealed],
  );

  const handlePointerDown = useCallback<PointerEventHandler<HTMLDivElement>>(
    (event) => {
      if (event.pointerType !== "touch") return;

      if (!touchRevealed) {
        event.preventDefault();
        setTouchRevealed(true);
      }
    },
    [touchRevealed],
  );

  const handleBlurCapture = useCallback<FocusEventHandler<HTMLDivElement>>(
    (event) => {
      const target = event.currentTarget;
      const nextFocus = event.relatedTarget as Node | null;
      if (nextFocus && target.contains(nextFocus)) {
        return;
      }
      setFocusWithin(false);
      setTouchRevealed(false);
    },
    [],
  );

  const handleEdit = useCallback<MouseEventHandler<HTMLButtonElement>>(
    (event) => {
      event.stopPropagation();
      onEdit(blockId);
    },
    [blockId, onEdit],
  );

  return (
    <Box
      data-preview-block-id={blockId}
      data-preview-block-type={blockType}
      onPointerDown={handlePointerDown}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={handleBlurCapture}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        width: "100%",
        position: "relative",
        borderRadius: 2,
        px: { xs: 1.75, sm: 2.5 },
        py: { xs: 1.75, sm: 2.25 },
        transition: "background-color 140ms ease, box-shadow 140ms ease",
        backgroundColor: showControls
          ? "rgba(15, 20, 25, 0.04)"
          : "transparent",
        boxShadow: showControls
          ? "0 0 0 1px rgba(15, 20, 25, 0.12)"
          : "0 0 0 1px transparent",
        outline: "none",
      }}
    >
      {children}
      <IconButton
        size="small"
        onClick={handleEdit}
        aria-label="Editar bloque"
        sx={{
          position: "absolute",
          top: { xs: 8, sm: 12 },
          right: { xs: 8, sm: 12 },
          color: "rgba(15, 20, 25, 0.6)",
          borderRadius: 999,
          boxShadow: "none",
          opacity: showControls
            ? BUTTON_OPACITY_VISIBLE
            : BUTTON_OPACITY_HIDDEN,
          pointerEvents: showControls ? "auto" : "none",
          transition: "opacity 140ms ease",
          "&:hover": {
            backgroundColor: "rgba(15, 20, 25, 0.1)",
            color: "rgba(15, 20, 25, 0.78)",
          },
        }}
      >
        <EditRoundedIcon sx={{ fontSize: "1.1rem" }} />
      </IconButton>
    </Box>
  );
}
