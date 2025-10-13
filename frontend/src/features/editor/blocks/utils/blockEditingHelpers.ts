import type { KeyboardEventHandler } from "react";
import { handleEditingKeyDown } from "../../utils/editingShortcuts";
import type { ChapterBlock, EditingState } from "../../types";

export function createBlockEditingSelector<TEditingState extends EditingState>(
  blockType: TEditingState["blockType"],
) {
  return (
    state: EditingState | undefined,
    block: ChapterBlock,
  ): TEditingState | undefined => {
    if (state?.blockType === blockType && state.blockId === block.id) {
      return state as TEditingState;
    }

    return undefined;
  };
}

export function createEditingShortcutHandler<
  TElement extends Element = Element,
>(
  editingState: Pick<EditingState, "onSave" | "onCancel">,
): KeyboardEventHandler<TElement> {
  return (event) => {
    handleEditingKeyDown(event, {
      onConfirm: editingState.onSave,
      onCancel: editingState.onCancel,
    });
  };
}
