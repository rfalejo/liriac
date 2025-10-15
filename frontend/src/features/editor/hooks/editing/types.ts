export type EditingDiscardContext = "cancel" | "switch";

export type EditorEditingSideEffects = {
  confirmDiscardChanges: (
    context: EditingDiscardContext,
  ) => Promise<boolean> | boolean;
  confirmDeleteBlock: () => Promise<boolean> | boolean;
  confirmDeleteBlockVersion: () => Promise<boolean> | boolean;
  notifyUpdateFailure: (error: unknown) => void;
};
