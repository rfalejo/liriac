import {
  createContext,
  useCallback,
  useContext,
  useMemo,
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
  SceneBoundaryEditingState,
  SceneBoundaryEditableField,
} from "../types";
import type {
  EditorEditingStore,
  ParagraphSessionState,
  DialogueSessionState,
  SceneBoundarySessionState,
  MetadataSessionState,
} from "../editing/editorEditingStore";
import { useBlockVersionController } from "../hooks/editing/useBlockVersionController";

type EditorBlockEditingContextValue = {
  editingState: EditingState | undefined;
  onEditBlock: (blockId: string) => void;
  onLongPressBlock?: (blockId: string) => void;
  longPressBlockId?: string | null;
  clearLongPress?: () => void;
};

const EditorBlockEditingContext =
  createContext<EditorBlockEditingContextValue | null>(null);

function buildParagraphEditingState(
  store: EditorEditingStore,
  session: ParagraphSessionState,
  isSaving: boolean,
  hasPendingChanges: boolean,
  versioning: BlockVersionState | undefined,
): ParagraphEditingState {
  return {
    blockId: session.blockId,
    blockType: "paragraph",
    paragraph: {
      draftText: session.draftText,
      onChangeDraft: (value: string) => {
        store.updateParagraphDraft(value);
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

  const contextValue = useMemo<EditorBlockEditingContextValue>(
    () => ({
      editingState,
      onEditBlock,
      onLongPressBlock,
      longPressBlockId,
      clearLongPress,
    }),
    [
      editingState,
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

  const { editingState, ...rest } = context;

  const scopedEditingState = blockId
    ? editingState && editingState.blockId === blockId
      ? editingState
      : undefined
    : editingState;

  return {
    editingState: scopedEditingState,
    ...rest,
  };
}
