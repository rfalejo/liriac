import Box from "@mui/material/Box";
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

type BlockByType<TType extends ChapterBlockType> = Extract<
  ChapterBlock,
  { type: TType }
>;

type BlockComponent<TType extends ChapterBlockType> = (props: {
  block: BlockByType<TType>;
}) => ReactNode;

function createBlockRenderer<TType extends ChapterBlockType>(
  type: TType,
  Component: BlockComponent<TType>,
): BlockRenderer {
  return ({ block }) => {
    if (block.type !== type) {
      return null;
    }

    return <Component block={block as BlockByType<TType>} />;
  };
}

const blockRegistry: BlockRegistry = {
  paragraph: createBlockRenderer("paragraph", ParagraphBlock),
  dialogue: createBlockRenderer("dialogue", DialogueBlock),
  scene_boundary: createBlockRenderer("scene_boundary", SceneBoundaryBlock),
  metadata: createBlockRenderer("metadata", MetadataBlock),
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
