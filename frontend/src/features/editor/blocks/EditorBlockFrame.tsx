import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import type { Theme } from "@mui/material/styles";
import {
  type FocusEventHandler,
  type MouseEventHandler,
  type PointerEventHandler,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from "react";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import type { components } from "../../../api/schema";

const BUTTON_OPACITY_VISIBLE = 1;
const BUTTON_OPACITY_HIDDEN = 0;

type ChapterBlockType = components["schemas"]["ChapterBlockTypeEnum"];

type EditorBlockFrameProps = {
  blockId: string;
  blockType: ChapterBlockType;
  onEdit?: (blockId: string) => void;
  controls?: ReactNode;
  isActive?: boolean;
  children: ReactNode;
};

export function EditorBlockFrame({
  blockId,
  blockType,
  onEdit,
  controls,
  isActive = false,
  children,
}: EditorBlockFrameProps) {
  const [focusWithin, setFocusWithin] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [touchRevealed, setTouchRevealed] = useState(false);

  const showControls = useMemo(
    () => isActive || focusWithin || hovered || touchRevealed,
    [focusWithin, hovered, touchRevealed, isActive],
  );

  useEffect(() => {
    if (isActive) {
      return;
    }
    setFocusWithin(false);
    setHovered(false);
    setTouchRevealed(false);
  }, [isActive]);

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
      if (!onEdit) {
        return;
      }
      onEdit(blockId);
    },
    [blockId, onEdit],
  );

  return (
    <Box
      data-editor-block-id={blockId}
      data-editor-block-type={blockType}
      onPointerDown={handlePointerDown}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={handleBlurCapture}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={(theme: Theme) => {
  const basePaddingX = theme.editor.blockPaddingX;
  const basePaddingY = theme.editor.blockPaddingY;
  const densePaddingY = { xs: 0.5, sm: 0.75 };
  const denseTopExtra = { xs: 0.125, sm: 0.25 };
  const activeTopOffset = { xs: 2.5, sm: 3 };

  const isExpanded = isActive;

        return {
          width: "100%",
          position: "relative",
          borderRadius: theme.editor.blockRadius,
          px: {
            xs: theme.spacing(basePaddingX.xs),
            sm: theme.spacing(basePaddingX.sm),
          },
          pt: {
            xs: theme.spacing(
              isExpanded
                ? basePaddingY.xs + activeTopOffset.xs
                : densePaddingY.xs + denseTopExtra.xs,
            ),
            sm: theme.spacing(
              isExpanded
                ? basePaddingY.sm + activeTopOffset.sm
                : densePaddingY.sm + denseTopExtra.sm,
            ),
          },
          pb: {
            xs: theme.spacing(isActive ? basePaddingY.xs : densePaddingY.xs),
            sm: theme.spacing(isActive ? basePaddingY.sm : densePaddingY.sm),
          },
          transition: theme.editor.blockTransition,
          backgroundColor: isActive
            ? theme.palette.editor.blockActiveBg
            : showControls
              ? theme.palette.editor.blockHoverBg
              : "transparent",
          boxShadow: isActive
            ? `0 0 0 1px ${theme.palette.editor.blockActiveOutline}`
            : showControls
              ? `0 0 0 1px ${theme.palette.editor.blockHoverOutline}`
              : "0 0 0 1px transparent",
          outline: "none",
        };
      }}
    >
      {children}
      <Box
        sx={(theme: Theme) => ({
          position: "absolute",
          top: { xs: 8, sm: 12 },
          right: { xs: 8, sm: 12 },
          display: "flex",
          gap: 0.5,
          opacity: showControls
            ? BUTTON_OPACITY_VISIBLE
            : BUTTON_OPACITY_HIDDEN,
          pointerEvents: showControls ? "auto" : "none",
          transition: theme.editor.blockControlsFade,
        })}
      >
        {controls ??
          (onEdit ? (
            <IconButton
              size="small"
              onClick={handleEdit}
              aria-label="Editar bloque"
              sx={(theme: Theme) => ({
                color: theme.palette.editor.blockIcon,
                borderRadius: 999,
                boxShadow: "none",
                transition: theme.editor.iconButtonTransition,
                "&:hover": {
                  backgroundColor: theme.palette.editor.blockMenuHoverBg,
                  color: theme.palette.editor.blockIconHover,
                },
              })}
            >
              <EditRoundedIcon sx={{ fontSize: "1.1rem" }} />
            </IconButton>
          ) : null)}
      </Box>
    </Box>
  );
}
