import type { ReactNode } from "react";
import { EditorBlockFrame } from "../EditorBlockFrame";
import { BlockEditControls } from "./BlockEditControls";
import { useEditorBlockEditing } from "../../context/EditorBlockEditingContext";
import type { ChapterBlock, EditingState } from "../../types";

type EditingStateSelector<TEditingState extends EditingState> = (
  state: EditingState | undefined,
  block: ChapterBlock,
) => TEditingState | undefined;

type EditableBlockProps<TEditingState extends EditingState> = {
  block: ChapterBlock;
  selectEditingState: EditingStateSelector<TEditingState>;
  renderReadView: (block: ChapterBlock) => ReactNode;
  renderEditView: (
    block: ChapterBlock,
    editingState: TEditingState,
  ) => ReactNode;
};

export function EditableBlock<TEditingState extends EditingState>({
  block,
  selectEditingState,
  renderReadView,
  renderEditView,
}: EditableBlockProps<TEditingState>) {
  const { editingState, onEditBlock } = useEditorBlockEditing();
  const resolvedEditingState = selectEditingState(editingState, block);
  const isEditing = Boolean(resolvedEditingState);

  const controls = resolvedEditingState ? (
    <BlockEditControls
      onConfirm={() => {
        resolvedEditingState.onSave();
      }}
      onCancel={() => {
        resolvedEditingState.onCancel();
      }}
      onDelete={resolvedEditingState.onDelete}
      disabled={resolvedEditingState.isSaving}
      supportsSuggestions={resolvedEditingState.supportsSuggestions}
      onRequestSuggestion={resolvedEditingState.onRequestSuggestion}
      suggestionPending={resolvedEditingState.isSuggestionPending}
      suggestionDisabled={resolvedEditingState.isSaving}
    />
  ) : undefined;

  return (
    <EditorBlockFrame
      blockId={block.id}
      blockType={block.type}
      onEdit={resolvedEditingState ? undefined : onEditBlock}
      controls={controls}
      isActive={isEditing}
    >
      {resolvedEditingState
        ? renderEditView(block, resolvedEditingState)
        : renderReadView(block)}
    </EditorBlockFrame>
  );
}
