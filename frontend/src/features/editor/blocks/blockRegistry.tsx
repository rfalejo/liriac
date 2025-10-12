import { Box } from "@mui/material";
import type { ReactNode } from "react";
import type { components } from "../../../api/schema";
import { editorBodyTypographySx, editorThemeConstants } from "../editorTheme";
import type { ChapterBlock, EditingState } from "../types";
import { DialogueBlock } from "./DialogueBlock";
import { MetadataBlock } from "./MetadataBlock";
import { ParagraphBlock } from "./ParagraphBlock";
import { SceneBoundaryBlock } from "./SceneBoundaryBlock";

type ChapterBlockType = components["schemas"]["ChapterBlockTypeEnum"];

type BlockRenderContext = {
  block: ChapterBlock;
  editingState?: EditingState;
  onEditBlock: (blockId: string) => void;
};

type BlockRenderer = (context: BlockRenderContext) => ReactNode | null;

type BlockRegistry = Partial<Record<ChapterBlockType, BlockRenderer>>;

const blockRegistry: BlockRegistry = {
  paragraph: ({ block, editingState, onEditBlock }) => {
    if (block.type !== "paragraph") {
      return null;
    }

    const isEditing =
      editingState?.blockType === "paragraph" &&
      editingState.blockId === block.id
        ? editingState
        : undefined;

    return (
      <ParagraphBlock
        block={block}
        onEdit={onEditBlock}
        isEditing={Boolean(isEditing)}
        draftText={isEditing ? isEditing.paragraph.draftText : ""}
        onDraftChange={isEditing?.paragraph.onChangeDraft}
        onCancelEdit={isEditing?.onCancel}
        onSaveEdit={isEditing?.onSave}
        disabled={isEditing?.isSaving ?? false}
      />
    );
  },
  dialogue: ({ block, editingState, onEditBlock }) => {
    if (block.type !== "dialogue") {
      return null;
    }

    const isEditing =
      editingState?.blockType === "dialogue" &&
      editingState.blockId === block.id
        ? editingState
        : undefined;

    return (
      <DialogueBlock
        block={block}
        onEdit={onEditBlock}
        isEditing={Boolean(isEditing)}
        draftTurns={isEditing ? isEditing.dialogue.turns : block.turns}
        onChangeTurn={isEditing?.dialogue.onChangeTurn}
        onAddTurn={isEditing?.dialogue.onAddTurn}
        onRemoveTurn={isEditing?.dialogue.onRemoveTurn}
        onCancelEdit={isEditing?.onCancel}
        onSaveEdit={isEditing?.onSave}
        disabled={isEditing?.isSaving ?? false}
      />
    );
  },
  scene_boundary: ({ block, onEditBlock }) => {
    if (block.type !== "scene_boundary") {
      return null;
    }

    return <SceneBoundaryBlock block={block} onEdit={onEditBlock} />;
  },
  metadata: ({ block, onEditBlock }) => {
    if (block.type !== "metadata") {
      return null;
    }

    return <MetadataBlock block={block} onEdit={onEditBlock} />;
  },
};

export function renderEditorBlock(context: BlockRenderContext): ReactNode | null {
  const registryKey = context.block.type;

  if (isRegisteredBlockType(registryKey)) {
    const renderer = blockRegistry[registryKey];
    if (renderer) {
      const rendered = renderer(context);
      if (rendered !== null && rendered !== undefined) {
        return rendered;
      }
    }
    return null;
  }

  return renderFallbackBlock(context.block);
}

function renderFallbackBlock(block: ChapterBlock) {
  return (
    <Box
      sx={{
        ...editorBodyTypographySx,
        border: "1px dashed rgba(27, 27, 27, 0.25)",
        borderRadius: 1,
        p: { xs: 2, sm: 3 },
        fontStyle: "italic",
        color: editorThemeConstants.mutedColor,
      }}
    >
      Bloque "{block.type}" pendiente de diseño.
    </Box>
  );
}

function isRegisteredBlockType(
  value: ChapterBlock["type"],
): value is ChapterBlockType {
  return Boolean(value && value in blockRegistry);
}
