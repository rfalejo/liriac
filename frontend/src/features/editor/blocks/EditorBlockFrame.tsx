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
  useRef,
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
  onLongPress?: (blockId: string) => void;
  activeLongPressBlockId?: string | null;
  onClearLongPress?: () => void;
  children: ReactNode;
};

export function EditorBlockFrame({
  blockId,
  blockType,
  onEdit,
  controls,
  isActive = false,
  onLongPress,
  activeLongPressBlockId,
  onClearLongPress,
  children,
}: EditorBlockFrameProps) {
  const [focusWithin, setFocusWithin] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [touchRevealed, setTouchRevealed] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressActivatedRef = useRef(false);

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

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!onLongPress) {
      return;
    }

    if (activeLongPressBlockId === blockId) {
      setTouchRevealed(true);
      longPressActivatedRef.current = true;
      return;
    }

    if (!isActive) {
      setTouchRevealed(false);
      longPressActivatedRef.current = false;
    }
  }, [activeLongPressBlockId, blockId, isActive, onLongPress]);

  const handlePointerDown = useCallback<PointerEventHandler<HTMLDivElement>>(
    (event) => {
      if (event.pointerType !== "touch") return;

      if (
        activeLongPressBlockId &&
        activeLongPressBlockId !== blockId &&
        onClearLongPress
      ) {
        longPressActivatedRef.current = false;
        onClearLongPress();
      }

      setTouchRevealed(true);

      if (onLongPress) {
        clearLongPressTimer();
        longPressTimerRef.current = window.setTimeout(() => {
          longPressTimerRef.current = null;
          longPressActivatedRef.current = true;
          onLongPress(blockId);
          setTouchRevealed(true);
        }, 450);
      }
    },
    [
      activeLongPressBlockId,
      blockId,
      clearLongPressTimer,
      onClearLongPress,
      onLongPress,
      touchRevealed,
    ],
  );

  const handlePointerUp = useCallback(() => {
    clearLongPressTimer();
    if (!longPressActivatedRef.current && !isActive) {
      setTouchRevealed(false);
    }
    longPressActivatedRef.current = false;
  }, [clearLongPressTimer, isActive]);

  const handlePointerLeave = useCallback<PointerEventHandler<HTMLDivElement>>(
    (event) => {
      if (event.pointerType !== "touch") {
        return;
      }
      clearLongPressTimer();
      if (!longPressActivatedRef.current && !isActive) {
        setTouchRevealed(false);
      }
      longPressActivatedRef.current = false;
    },
    [clearLongPressTimer, isActive],
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
      longPressActivatedRef.current = false;
      if (onClearLongPress) {
        onClearLongPress();
      }
    },
    [onClearLongPress],
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
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
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
        data-editor-block-controls="true"
        sx={(theme: Theme) => {
          const topOffset = {
            xs: `calc(-1 * ${theme.spacing(2.4)})`,
            sm: `calc(-1 * ${theme.spacing(2.75)})`,
          } as const;

          return {
            position: "absolute",
            top: topOffset,
            right: {
              xs: theme.spacing(1),
              sm: theme.spacing(1.5),
            },
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            padding: theme.spacing(0.375, 0.75),
            borderRadius: 999,
            backgroundColor: showControls
              ? "rgba(68, 52, 38, 0.12)"
              : "rgba(68, 52, 38, 0.06)",
            border: "none",
            boxShadow: showControls ? "0 4px 14px rgba(32, 24, 16, 0.18)" : "none",
            opacity: showControls
              ? BUTTON_OPACITY_VISIBLE
              : BUTTON_OPACITY_HIDDEN,
            pointerEvents: showControls ? "auto" : "none",
            transition: `${theme.editor.blockControlsFade}, background-color 160ms ease, box-shadow 160ms ease, border-color 160ms ease`,
          };
        }}
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
