import type { KeyboardEvent as ReactKeyboardEvent } from "react";

type EditingShortcutHandlers = {
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
};

const ENTER_KEY = "Enter";
const ESCAPE_KEY = "Escape";

const hasModifier = (
  event: Pick<ReactKeyboardEvent<Element>, "metaKey" | "ctrlKey">,
) => event.metaKey || event.ctrlKey;

export const isConfirmShortcut = (
  event: Pick<ReactKeyboardEvent<Element>, "key" | "metaKey" | "ctrlKey">,
) => event.key === ENTER_KEY && hasModifier(event);

export const isCancelShortcut = (
  event: Pick<ReactKeyboardEvent<Element>, "key">,
) => event.key === ESCAPE_KEY;

export function handleEditingKeyDown<T extends Element>(
  event: ReactKeyboardEvent<T>,
  handlers: EditingShortcutHandlers,
) {
  if (isConfirmShortcut(event)) {
    event.preventDefault();
    void handlers.onConfirm?.();
    return true;
  }

  if (isCancelShortcut(event)) {
    event.preventDefault();
    handlers.onCancel?.();
    return true;
  }

  return false;
}
