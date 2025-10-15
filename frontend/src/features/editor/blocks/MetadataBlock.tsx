import type { components } from "../../../api/schema";
import type { BlockRenderContext } from "./blockRegistry";
import type { MetadataEditingState } from "../types";
import { EditableBlock } from "./components/EditableBlock";
import { MetadataEditView } from "./components/MetadataEditView";
import { MetadataReadView } from "./components/MetadataReadView";
import { createBlockEditingSelector } from "./utils/blockEditingHelpers";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type MetadataBlockProps = {
  block: ChapterBlock;
  context: BlockRenderContext;
};

export function MetadataBlock({ block }: MetadataBlockProps) {
  if ((block.kind ?? "metadata") === "editorial") {
    return null;
  }

  return (
    <EditableBlock<MetadataEditingState>
      block={block}
      selectEditingState={createBlockEditingSelector("metadata")}
      renderReadView={(currentBlock) => (
        <MetadataReadView block={currentBlock} />
      )}
      renderEditView={(currentBlock, editing) => (
        <MetadataEditView block={currentBlock} editingState={editing} />
      )}
    />
  );
}
