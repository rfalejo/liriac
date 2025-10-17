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
import type {
  DialogueEditingState,
  DialogueField,
  DialogueTurn,
  EditingState,
  BlockVersionState,
  MetadataEditingState,
  MetadataEditableField,
  MetadataKindOption,
  ParagraphEditingState,
  ParagraphSuggestionResultState,
  ParagraphSuggestionState,
  SceneBoundaryEditingState,
  SceneBoundaryEditableField,
} from "../types";
import type {
  EditorEditingStore,
  ParagraphSessionState,
  DialogueSessionState,
  SceneBoundarySessionState,
  MetadataSessionState,
  ParagraphSuggestionContext,
} from "../editing/editorEditingStore";
import { useBlockVersionController } from "../hooks/editing/useBlockVersionController";

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

function mapSuggestionContextToState(
  context: ParagraphSuggestionContext,
): ParagraphSuggestionState {
  const snapshot = context.getSnapshot();
  const result = snapshot.result
    ? {
        instructions: snapshot.result.instructions,
        text: snapshot.result.text,
        isApplied: snapshot.result.isApplied,
        onApply: () => {
          context.handlers.applyResult();
        },
        onDismiss: () => {
          context.handlers.dismissResult();
        },
      } satisfies ParagraphSuggestionResultState
    : null;

  return {
    promptOpen: snapshot.promptOpen,
    instructions: snapshot.instructions,
    onChangeInstructions: (value: string) => {
      context.handlers.setInstructions(value);
    },
    onSubmit: () => context.handlers.submit(),
    onClosePrompt: () => {
      context.handlers.closePrompt();
    },
    isRequesting: snapshot.isRequestPending,
    onCopyPrompt: () => context.handlers.copyPrompt(),
    isCopyingPrompt: snapshot.isCopyPending,
    copyStatus: snapshot.copyStatus === "copied" ? "copied" : "idle",
    error: snapshot.error,
    result,
    usesDraftAsPrompt: snapshot.usesDraftAsPrompt,
  } satisfies ParagraphSuggestionState;
}

function buildParagraphEditingState(
  store: EditorEditingStore,
  session: ParagraphSessionState,
  isSaving: boolean,
  hasPendingChanges: boolean,
  versioning: BlockVersionState | undefined,
): ParagraphEditingState {
  const suggestionContext = session.suggestionContext;
  const suggestionSnapshot = suggestionContext.getSnapshot();
  const suggestion = mapSuggestionContextToState(suggestionContext);

  const handleCancel = () => {
    suggestionContext.handlers.closePrompt();
    store.cancelEditing();
  };

  const handleSave = () => {
    suggestionContext.handlers.closePrompt();
    store.saveActiveBlock();
  };

  const handleDelete = () => {
    suggestionContext.handlers.closePrompt();
    void store.confirmDeleteActiveBlock();
  };

  return {
    blockId: session.blockId,
    blockType: "paragraph",
    supportsSuggestions: true,
    onRequestSuggestion: () => {
      suggestionContext.handlers.openPrompt();
    },
    isSuggestionPending: suggestionSnapshot.isRequestPending,
    paragraph: {
      draftText: session.draftText,
      onChangeDraft: (value: string) => {
        store.updateParagraphDraft(value);
      },
      suggestion,
    },
    onCancel: handleCancel,
    onSave: handleSave,
    onDelete: handleDelete,
    isSaving,
    hasPendingChanges,
    versioning,
  } satisfies ParagraphEditingState;
}

function buildDialogueEditingState(
  store: EditorEditingStore,
  session: DialogueSessionState,
  isSaving: boolean,
  hasPendingChanges: boolean,
  versioning: BlockVersionState | undefined,
): DialogueEditingState {
  return {
    blockId: session.blockId,
    blockType: "dialogue",
    dialogue: {
      turns: session.draftTurns,
      onChangeTurn: (turnId: string, field: DialogueField, value: string) => {
        store.changeDialogueTurn(turnId, field as keyof DialogueTurn, value);
      },
      onAddTurn: () => {
        store.addDialogueTurn();
      },
      onRemoveTurn: (turnId: string) => {
        store.removeDialogueTurn(turnId);
      },
    },
    onCancel: () => {
      store.cancelEditing();
    },
    onSave: () => {
      store.saveActiveBlock();
    },
    onDelete: () => {
      void store.confirmDeleteActiveBlock();
    },
    isSaving,
    hasPendingChanges,
    versioning,
  } satisfies DialogueEditingState;
}

function buildSceneBoundaryEditingState(
  store: EditorEditingStore,
  session: SceneBoundarySessionState,
  isSaving: boolean,
  hasPendingChanges: boolean,
  versioning: BlockVersionState | undefined,
): SceneBoundaryEditingState {
  return {
    blockId: session.blockId,
    blockType: "scene_boundary",
    sceneBoundary: {
      draft: session.draft,
      onChangeField: (field: SceneBoundaryEditableField, value: string) => {
        store.updateSceneBoundaryField(field, value);
      },
    },
    onCancel: () => {
      store.cancelEditing();
    },
    onSave: () => {
      store.saveActiveBlock();
    },
    onDelete: () => {
      void store.confirmDeleteActiveBlock();
    },
    isSaving,
    hasPendingChanges,
    versioning,
  } satisfies SceneBoundaryEditingState;
}

function buildMetadataEditingState(
  store: EditorEditingStore,
  session: MetadataSessionState,
  isSaving: boolean,
  hasPendingChanges: boolean,
  versioning: BlockVersionState | undefined,
): MetadataEditingState {
  return {
    blockId: session.blockId,
    blockType: "metadata",
    metadata: {
      kind: session.kind,
      draft: session.draft,
      onChangeField: (field: MetadataEditableField, value: string) => {
        store.updateMetadataField(field, value);
      },
      onChangeKind: (nextKind: MetadataKindOption) => {
        store.changeMetadataKind(nextKind);
      },
    },
    onCancel: () => {
      store.cancelEditing();
    },
    onSave: () => {
      store.saveActiveBlock();
    },
    onDelete: () => {
      void store.confirmDeleteActiveBlock();
    },
    isSaving,
    hasPendingChanges,
    versioning,
  } satisfies MetadataEditingState;
}

function buildEditingState(
  store: EditorEditingStore,
  snapshot: ReturnType<EditorEditingStore["getSnapshot"]>,
  versioning: BlockVersionState | undefined,
): EditingState | undefined {
  const session = snapshot.activeSession;
  if (!session) {
    return undefined;
  }

  const isSaving = snapshot.isUpdatePending || snapshot.isDeletePending;
  const hasPendingChanges = store.hasActivePendingChanges();

  switch (session.type) {
    case "paragraph":
      return buildParagraphEditingState(store, session, isSaving, hasPendingChanges, versioning);
    case "dialogue":
      return buildDialogueEditingState(store, session, isSaving, hasPendingChanges, versioning);
    case "scene_boundary":
      return buildSceneBoundaryEditingState(store, session, isSaving, hasPendingChanges, versioning);
    case "metadata":
      return buildMetadataEditingState(store, session, isSaving, hasPendingChanges, versioning);
    default:
      return undefined;
  }
}

type EditorBlockEditingProviderProps = {
  children: ReactNode;
  store: EditorEditingStore | null;
  onEditBlock: (blockId: string) => void;
  onLongPressBlock?: (blockId: string) => void;
  longPressBlockId?: string | null;
  clearLongPress?: () => void;
};

export function EditorBlockEditingProvider({
  children,
  store,
  onEditBlock,
  onLongPressBlock,
  longPressBlockId,
  clearLongPress,
}: EditorBlockEditingProviderProps) {
  const editingStateRef = useRef<EditingState | undefined>(undefined);
  const listenersRef = useRef(new Set<() => void>());

  const subscribeToStore = useCallback(
    (listener: () => void) => (store ? store.subscribe(listener) : () => {}),
    [store],
  );

  const readStoreSnapshot = useCallback(
    () => (store ? store.getSnapshot() : null),
    [store],
  );

  const storeSnapshot = useSyncExternalStore(
    subscribeToStore,
    readStoreSnapshot,
    readStoreSnapshot,
  );

  const activeSession = storeSnapshot?.activeSession ?? null;
  const activeBlock = store && activeSession ? store.getBlock(activeSession.blockId) : null;
  const chapterId = store?.getChapterId() ?? null;
  const isSaving = Boolean(storeSnapshot?.isUpdatePending || storeSnapshot?.isDeletePending);

  const versioning = useBlockVersionController({
    block: activeBlock,
    chapterId,
    isActive: Boolean(activeSession),
    isSaving,
    updateBlock: (args) => {
      if (!store) {
        return Promise.reject(new Error("Missing editing store"));
      }
      return store.updateBlockDirect(args);
    },
    sideEffects: store
      ? store.getVersioningSideEffects()
      : {
          notifyUpdateFailure: () => {},
          confirmDeleteBlockVersion: () => Promise.resolve(false),
        },
  });

  const editingState = useMemo(() => {
    if (!store || !storeSnapshot) {
      return undefined;
    }
    return buildEditingState(store, storeSnapshot, versioning ?? undefined);
  }, [store, storeSnapshot, versioning]);

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
