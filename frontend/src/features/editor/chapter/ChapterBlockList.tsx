import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { Theme } from "@mui/material/styles";
import type {
  ChapterBlockEntry,
  ChapterBlockType,
} from "../hooks/useChapterBlocks";
import {
  BlockInsertMenu,
  type BlockInsertPosition,
} from "../blocks/BlockInsertMenu";
import { getNarrativeBlockSpacing } from "../utils/blockSpacing";
import { useEditorBlockEditing } from "../context/EditorBlockEditingContext";
import { DraftConversionPreview } from "../conversions/DraftConversionPreview";
import type { DraftBlockConversion } from "../hooks/useBlockConversion";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

export type ChapterBlockListProps = {
  blockEntries: ChapterBlockEntry[];
  onInsertBlock?: (
    blockType: ChapterBlockType,
    position: BlockInsertPosition,
  ) => void;
  onOpenConversion?: (position: BlockInsertPosition) => void;
  conversionDisabled?: boolean;
  conversionDraft?: DraftBlockConversion | null;
  conversionApplying?: boolean;
  conversionApplyError?: string | null;
  onAcceptConversion?: () => void;
  onRejectConversion?: () => void;
};

export function ChapterBlockList({
  blockEntries,
  onInsertBlock,
  onOpenConversion,
  conversionDisabled,
  conversionDraft,
  conversionApplying,
  conversionApplyError,
  onAcceptConversion,
  onRejectConversion,
}: ChapterBlockListProps) {
  const { editingState, longPressBlockId, clearLongPress } = useEditorBlockEditing();
  const isTouchViewport = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("sm"),
  );
  const activeBlockId = editingState?.blockId ?? null;
  const [activeMenu, setActiveMenu] = useState<
    { anchorEl: HTMLButtonElement; position: BlockInsertPosition }
  | null>(null);
  const anchorRef = useRef<HTMLButtonElement | null>(null);

  const canOpenMenus = Boolean(onInsertBlock || onOpenConversion);

  if (blockEntries.length === 0) {
    return null;
  }

  const previewIndex = conversionDraft
    ? conversionDraft.position?.index ?? blockEntries.length
    : null;

  const blockSpacingStyles = useMemo(() => {
    return blockEntries.map((entry, index) => {
      const previousEntry = index > 0 ? blockEntries[index - 1] : null;
      const previousType = previousEntry?.type ?? null;
      const isActive = entry.id === activeBlockId;
      const previousIsActive = previousEntry?.id === activeBlockId;

      let marginTop =
        index === 0 ? 0 : getNarrativeBlockSpacing(previousType, entry.type);

      if (isActive && index > 0) {
        marginTop = Math.max(marginTop, 0.75);
      }

      if (previousIsActive) {
        marginTop = Math.max(marginTop, 0.75);
      }

      return {
        mt: marginTop,
        mb: isActive ? 0.5 : 0,
      };
    });
  }, [blockEntries, activeBlockId]);

  const renderPreview = (slotIndex: number) => {
    if (
      conversionDraft == null ||
      previewIndex == null ||
      previewIndex !== slotIndex
    ) {
      return null;
    }

    return (
      <Box
        sx={(theme) => ({
          width: "100%",
          mt: { xs: theme.spacing(1.5), sm: theme.spacing(2) },
          mb: { xs: theme.spacing(1.5), sm: theme.spacing(2) },
        })}
      >
        <DraftConversionPreview
          blocks={conversionDraft.blocks}
          onAccept={() => {
            onAcceptConversion?.();
          }}
          onReject={() => {
            onRejectConversion?.();
          }}
          accepting={Boolean(conversionApplying)}
          error={conversionApplyError ?? null}
        />
      </Box>
    );
  };

  const handleOpenMenu = useCallback(
    (position: BlockInsertPosition, anchor: HTMLButtonElement) => {
      anchorRef.current = anchor;
      setActiveMenu({ position, anchorEl: anchor });
    },
    [],
  );

  const handleCloseMenu = useCallback(() => {
    setActiveMenu(null);
    const anchor = anchorRef.current;
    anchorRef.current = null;
    if (anchor) {
      anchor.focus({ preventScroll: true });
    }
    if (isTouchViewport) {
      clearLongPress?.();
    }
  }, [clearLongPress, isTouchViewport]);

  useEffect(() => {
    if (!activeMenu) {
      return;
    }

    if (!canOpenMenus) {
      handleCloseMenu();
      return;
    }

    if (!isTouchViewport) {
      return;
    }

    if (!longPressBlockId) {
      handleCloseMenu();
      return;
    }

    const { position } = activeMenu;
    const matchesLongPress =
      position.beforeBlockId === longPressBlockId ||
      position.afterBlockId === longPressBlockId;

    if (!matchesLongPress) {
      handleCloseMenu();
    }
  }, [activeMenu, canOpenMenus, handleCloseMenu, isTouchViewport, longPressBlockId]);

  const renderInsertSlot = (position: BlockInsertPosition) => {
    const preview = renderPreview(position.index);

    if (!canOpenMenus) {
      return preview;
    }

    const relationToLongPress = isTouchViewport && longPressBlockId
      ? position.beforeBlockId === longPressBlockId
        ? "before"
        : position.afterBlockId === longPressBlockId
          ? "after"
          : null
      : null;

    const visible = !isTouchViewport || relationToLongPress !== null;

    return (
      <Fragment>
        <InsertSlotTrigger
          position={position}
          relation={relationToLongPress}
          visible={visible}
          isTouchViewport={isTouchViewport}
          isActive={isSamePosition(activeMenu?.position, position)}
          onOpen={handleOpenMenu}
        />
        {preview}
      </Fragment>
    );
  };

  return (
    <Stack spacing={0}>
      {blockEntries.map((entry, index) => {
        const insertPosition: BlockInsertPosition = {
          afterBlockId: index > 0 ? blockEntries[index - 1]?.id ?? null : null,
          beforeBlockId: entry.id,
          index,
        };

        return (
          <Fragment key={entry.id}>
            {renderInsertSlot(insertPosition)}
            <Box sx={blockSpacingStyles[index]}>
              {entry.node}
            </Box>
            {index === blockEntries.length - 1
              ? renderInsertSlot({
                  afterBlockId: entry.id,
                  beforeBlockId: null,
                  index: index + 1,
                })
              : null}
          </Fragment>
        );
      })}
      <BlockInsertMenu
        anchorEl={activeMenu?.anchorEl ?? null}
        open={Boolean(activeMenu)}
        position={activeMenu?.position ?? null}
        onClose={handleCloseMenu}
        onInsertBlock={onInsertBlock}
        onOpenConversion={onOpenConversion}
        conversionDisabled={conversionDisabled}
      />
    </Stack>
  );
}

type SlotRelation = "before" | "after" | null;

type InsertSlotTriggerProps = {
  position: BlockInsertPosition;
  relation: SlotRelation;
  visible: boolean;
  isTouchViewport: boolean;
  isActive: boolean;
  onOpen: (position: BlockInsertPosition, anchor: HTMLButtonElement) => void;
};

function InsertSlotTrigger({
  position,
  relation,
  visible,
  isTouchViewport,
  isActive,
  onOpen,
}: InsertSlotTriggerProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const TriggerIcon = useMemo(() => {
    if (!isTouchViewport) {
      return MoreHorizRoundedIcon;
    }

    if (relation === "before") {
      return ExpandLessRoundedIcon;
    }

    if (relation === "after") {
      return ExpandMoreRoundedIcon;
    }

    return MoreHorizRoundedIcon;
  }, [isTouchViewport, relation]);

  const showButton = !isTouchViewport || visible || isActive;
  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onOpen(position, event.currentTarget as HTMLButtonElement);
    },
    [onOpen, position],
  );

  return (
    <Box
      data-editor-block-insert-slot="true"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={(theme: Theme) => ({
        width: "100%",
        minHeight: showButton
          ? {
              xs: theme.spacing(1.75),
              sm: theme.spacing(2.25),
            }
          : 0,
        display: showButton ? "grid" : "none",
        placeItems: "center",
        pointerEvents: showButton ? "auto" : "none",
      })}
    >
      <IconButton
        size="small"
        aria-label="Mostrar tipos de bloque disponibles"
        aria-haspopup="dialog"
        onClick={handleClick}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            handleClick(event);
          }
        }}
        sx={(theme: Theme) => ({
          opacity: isTouchViewport
            ? visible
              ? 0.96
              : 0
            : hovered || focused || isActive
              ? 0.96
              : 0,
          transition: "opacity 160ms ease",
          color: theme.palette.editor.blockMenuTrigger,
          backgroundColor: isActive
            ? theme.palette.editor.blockHoverBg
            : "transparent",
          boxShadow: isActive
            ? `0 0 0 1px ${theme.palette.editor.blockHoverOutline}`
            : "none",
          "&:hover": {
            backgroundColor: theme.palette.editor.blockMenuHoverBg,
            color: theme.palette.editor.blockMenuTriggerHover,
          },
        })}
      >
        <TriggerIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

function isSamePosition(
  current: BlockInsertPosition | null | undefined,
  target: BlockInsertPosition,
) {
  if (!current) {
    return false;
  }

  return (
    current.index === target.index &&
    current.beforeBlockId === target.beforeBlockId &&
    current.afterBlockId === target.afterBlockId
  );
}
