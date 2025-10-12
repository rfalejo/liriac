import { createContext, useContext, type ReactNode } from "react";
import type { EditingState } from "../types";

type EditorBlockEditingContextValue = {
  editingState?: EditingState;
  onEditBlock: (blockId: string) => void;
};

const EditorBlockEditingContext =
  createContext<EditorBlockEditingContextValue | null>(null);

type EditorBlockEditingProviderProps = {
  children: ReactNode;
  editingState?: EditingState;
  onEditBlock: (blockId: string) => void;
};

export function EditorBlockEditingProvider({
  children,
  editingState,
  onEditBlock,
}: EditorBlockEditingProviderProps) {
  return (
    <EditorBlockEditingContext.Provider value={{ editingState, onEditBlock }}>
      {children}
    </EditorBlockEditingContext.Provider>
  );
}

export function useEditorBlockEditing() {
  const context = useContext(EditorBlockEditingContext);

  if (!context) {
    throw new Error(
      "useEditorBlockEditing must be used within EditorBlockEditingProvider",
    );
  }

  return context;
}
