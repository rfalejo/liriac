import { Box } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import type { components } from "../../../api/schema";
import type { ChapterBlock } from "../types";
import { DialogueBlock } from "./DialogueBlock";
import { MetadataBlock } from "./MetadataBlock";
import { ParagraphBlock } from "./ParagraphBlock";
import { SceneBoundaryBlock } from "./SceneBoundaryBlock";

type ChapterBlockType = components["schemas"]["ChapterBlockTypeEnum"];

type BlockRenderContext = {
  block: ChapterBlock;
};

type BlockRenderer = (context: BlockRenderContext) => ReactNode | null;

type BlockRegistry = Partial<Record<ChapterBlockType, BlockRenderer>>;

const blockRegistry: BlockRegistry = {
  paragraph: ({ block }) => {
    if (block.type !== "paragraph") {
      return null;
    }

    return <ParagraphBlock block={block} />;
  },
  dialogue: ({ block }) => {
    if (block.type !== "dialogue") {
      return null;
    }

    return <DialogueBlock block={block} />;
  },
  scene_boundary: ({ block }) => {
    if (block.type !== "scene_boundary") {
      return null;
    }

    return <SceneBoundaryBlock block={block} />;
  },
  metadata: ({ block }) => {
    if (block.type !== "metadata") {
      return null;
    }

    return <MetadataBlock block={block} />;
  },
};

export function renderEditorBlock(
  context: BlockRenderContext,
): ReactNode | null {
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
      sx={(theme: Theme) => ({
        ...theme.typography.editorBody,
        border: `1px dashed ${theme.palette.editor.blockFallbackBorder}`,
        borderRadius: 1,
        p: { xs: 2, sm: 3 },
        fontStyle: "italic",
        color: theme.palette.editor.blockMuted,
      })}
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
