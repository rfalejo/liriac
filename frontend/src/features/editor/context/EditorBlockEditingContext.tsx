import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { EditingState } from "../types";

type EditorBlockEditingContextValue = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => EditingState | undefined;
  getBlockSnapshot: (blockId: string) => EditingState | undefined;
  onEditBlock: (blockId: string) => void;
  onLongPressBlock?: (blockId: string) => void;
  longPressBlockId?: string | null;
  clearLongPress?: () => void;
};

const EditorBlockEditingContext =
  createContext<EditorBlockEditingContextValue | null>(null);

type EditorBlockEditingProviderProps = {
  children: ReactNode;
  editingState?: EditingState;
  onEditBlock: (blockId: string) => void;
  onLongPressBlock?: (blockId: string) => void;
  longPressBlockId?: string | null;
  clearLongPress?: () => void;
};

export function EditorBlockEditingProvider({
  children,
  editingState,
  onEditBlock,
  onLongPressBlock,
  longPressBlockId,
  clearLongPress,
}: EditorBlockEditingProviderProps) {
  const editingStateRef = useRef<EditingState | undefined>(editingState);
  const listenersRef = useRef(new Set<() => void>());

  useEffect(() => {
    editingStateRef.current = editingState;
    listenersRef.current.forEach((listener) => {
      listener();
    });
  }, [editingState]);

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const getSnapshot = useCallback(() => editingStateRef.current, []);

  const getBlockSnapshot = useCallback(
    (blockId: string) => {
      const current = editingStateRef.current;
      return current?.blockId === blockId ? current : undefined;
    },
    [],
  );

  const contextValue = useMemo<EditorBlockEditingContextValue>(
    () => ({
      subscribe,
      getSnapshot,
      getBlockSnapshot,
      onEditBlock,
      onLongPressBlock,
      longPressBlockId,
      clearLongPress,
    }),
    [
      subscribe,
      getSnapshot,
      getBlockSnapshot,
      onEditBlock,
      onLongPressBlock,
      longPressBlockId,
      clearLongPress,
    ],
  );

  return (
    <EditorBlockEditingContext.Provider value={contextValue}>
      {children}
    </EditorBlockEditingContext.Provider>
  );
}

export function useEditorBlockEditing(blockId?: string) {
  const context = useContext(EditorBlockEditingContext);

  if (!context) {
    throw new Error(
      "useEditorBlockEditing must be used within EditorBlockEditingProvider",
    );
  }

  const { subscribe, getSnapshot, getBlockSnapshot, ...rest } = context;

  const snapshotFn = useCallback(
    () => (blockId ? getBlockSnapshot(blockId) : getSnapshot()),
    [blockId, getBlockSnapshot, getSnapshot],
  );

  const serverSnapshotFn = useCallback(
    () => (blockId ? getBlockSnapshot(blockId) : getSnapshot()),
    [blockId, getBlockSnapshot, getSnapshot],
  );

  const editingState = useSyncExternalStore(subscribe, snapshotFn, serverSnapshotFn);

  return {
    editingState,
    ...rest,
  };
}
