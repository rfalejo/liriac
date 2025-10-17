import { useCallback, useEffect, useMemo } from "react";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import Tooltip from "@mui/material/Tooltip";
import type { Theme } from "@mui/material/styles";
import SubjectRoundedIcon from "@mui/icons-material/SubjectRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import LandscapeRoundedIcon from "@mui/icons-material/LandscapeRounded";
import ContentPasteRoundedIcon from "@mui/icons-material/ContentPasteRounded";
import type { components } from "../../../api/schema";

type ChapterBlockType = components["schemas"]["ChapterBlockTypeEnum"];

export type BlockInsertPosition = {
  afterBlockId: string | null;
  beforeBlockId: string | null;
  index: number;
};

type BlockInsertMenuProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  position: BlockInsertPosition | null;
  onInsertBlock?: (
    blockType: ChapterBlockType,
    position: BlockInsertPosition,
  ) => void;
  onOpenConversion?: (position: BlockInsertPosition) => void;
  conversionDisabled?: boolean;
  onClose: () => void;
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
  anchorEl,
  open,
  position,
  onInsertBlock,
  onOpenConversion,
  conversionDisabled = false,
  onClose,
}: BlockInsertMenuProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const handleSelectBlock = useCallback(
    (type: ChapterBlockType) => {
      if (!position) {
        return;
      }
      onInsertBlock?.(type, position);
      onClose();
    },
    [onClose, onInsertBlock, position],
  );

  const handleConversion = useCallback(() => {
    if (!position || conversionDisabled) {
      return;
    }
    onOpenConversion?.(position);
    onClose();
  }, [conversionDisabled, onClose, onOpenConversion, position]);

  const optionButtons = useMemo(() => {
    const blockButtons = BLOCK_INSERT_OPTIONS.map(({ type, label, Icon }) => (
      <Tooltip key={type} title={label} placement="top" arrow>
        <IconButton
          size="small"
          onClick={() => {
            handleSelectBlock(type);
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
            onClick={handleConversion}
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
  }, [conversionDisabled, handleConversion, handleSelectBlock, onOpenConversion]);

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="top"
      role="dialog"
      modifiers={[
        {
          name: "offset",
          options: { offset: [0, 12] },
        },
      ]}
    >
      <ClickAwayListener onClickAway={onClose}>
        <Paper
          data-editor-block-insert-menu="true"
          elevation={0}
          sx={(theme: Theme) => ({
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
            px: 1.25,
            py: 0.35,
            borderRadius: 999,
            backgroundColor: theme.palette.editor.blockHoverBg,
            boxShadow: `0 0 0 1px ${theme.palette.editor.blockHoverOutline}, 0 18px 32px rgba(36, 28, 18, 0.18)`,
          })}
        >
          {optionButtons}
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
}
