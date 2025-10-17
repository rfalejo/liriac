import type {
  ChapterBlockUpdatePayload,
  ChapterDetail,
} from "../../../api/chapters";
import type {
  ChapterBlock,
  DialogueTurn,
  MetadataEditableField,
  MetadataKindOption,
  SceneBoundaryEditableField,
} from "../types";
import type { EditorEditingSideEffects } from "../hooks/editing/types";
import { cloneTurns, createEmptyTurn, equalTurns } from "../utils/dialogueTurns";
import type { InternalSessionState } from "./sessionTypes";
import {
  buildDialogueSession,
  buildMetadataSession,
  buildParagraphSession,
  buildSceneBoundarySession,
  getRelevantMetadataFields,
  isEditableBlock,
  metadataFieldValue,
  normalizeMetadataKind,
  toMetadataDraft,
  toSceneBoundaryDraft,
} from "./sessionBuilders";
import { ParagraphSuggestionManager } from "./paragraphSuggestions";
import type { ParagraphSuggestionSnapshot } from "./paragraphSuggestions.types";
import {
  buildDialoguePayload,
  buildMetadataPayload,
  buildParagraphPayload,
  buildSceneBoundaryPayload,
} from "./payloadBuilders";

export type {
  ParagraphSessionState,
  DialogueSessionState,
  SceneBoundarySessionState,
  MetadataSessionState,
} from "./sessionTypes";
export type { ParagraphSuggestionContext, ParagraphSuggestionSnapshot } from "./paragraphSuggestions.types";

type EditorEditingInternalState = EditorEditingStoreSnapshot & {
  chapterId: string | null;
};

type BlockResolver = (blockId: string) => ChapterBlock | null;

type UpdateBlockFn = (args: {
  blockId: string;
  payload: ChapterBlockUpdatePayload;
}) => Promise<ChapterDetail>;

type DeleteBlockFn = (blockId: string) => Promise<ChapterDetail>;

type EditorEditingStoreSnapshot = {
  activeSession: InternalSessionState | null;
  isUpdatePending: boolean;
  isDeletePending: boolean;
};

type MetadataFieldName = MetadataEditableField;

export type EditorEditingStoreOptions = {
  chapterId: string | null;
  blockResolver: BlockResolver;
  updateBlock: UpdateBlockFn;
  deleteBlock: DeleteBlockFn;
  sideEffects: EditorEditingSideEffects;
};

export class EditorEditingStore {
  private state: EditorEditingInternalState;
  private listeners: Set<() => void> = new Set();
  private blockResolver: BlockResolver;
  private readonly updateBlock: UpdateBlockFn;
  private readonly deleteBlock: DeleteBlockFn;
  private readonly sideEffects: EditorEditingSideEffects;
  private paragraphSuggestions: ParagraphSuggestionManager;

  constructor(options: EditorEditingStoreOptions) {
    this.state = {
      chapterId: options.chapterId,
      activeSession: null,
      isUpdatePending: false,
      isDeletePending: false,
    } satisfies EditorEditingInternalState;
    this.blockResolver = options.blockResolver;
    this.updateBlock = options.updateBlock;
    this.deleteBlock = options.deleteBlock;
    this.sideEffects = options.sideEffects;
    this.paragraphSuggestions = new ParagraphSuggestionManager({
      getActiveParagraphSession: () => this.ensureActiveSessionOfType("paragraph"),
      getChapterId: () => this.state.chapterId,
      resolveBlock: (blockId) => this.resolveBlock(blockId),
      notifyUpdateFailure: this.sideEffects.notifyUpdateFailure,
      notifyStore: () => this.notify(),
    });
  }

  getSnapshot(): EditorEditingStoreSnapshot {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  updateChapterId(chapterId: string | null) {
    if (this.state.chapterId === chapterId) {
      return;
    }
    this.state = {
      ...this.state,
      chapterId,
      activeSession: null,
    } satisfies EditorEditingInternalState;
    this.notify();
  }

  setBlockResolver(resolver: BlockResolver) {
    this.blockResolver = resolver;
  }

  setMutationState({
    updatePending,
    deletePending,
  }: {
    updatePending: boolean;
    deletePending: boolean;
  }) {
    const next = {
      ...this.state,
      isUpdatePending: updatePending,
      isDeletePending: deletePending,
    } satisfies EditorEditingInternalState;
    if (
      next.isUpdatePending === this.state.isUpdatePending &&
      next.isDeletePending === this.state.isDeletePending
    ) {
      return;
    }
    this.state = next;
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  private resolveBlock(blockId: string): ChapterBlock | null {
    return this.blockResolver(blockId);
  }

  private createSessionFromBlock(block: ChapterBlock): InternalSessionState {
    switch (block.type) {
      case "paragraph": {
        this.paragraphSuggestions.reset(block.id);
        const context = this.paragraphSuggestions.getContext(block.id);
        return buildParagraphSession(block, context);
      }
      case "dialogue":
        return buildDialogueSession(block);
      case "scene_boundary":
        return buildSceneBoundarySession(block);
      case "metadata":
        return buildMetadataSession(block);
      default:
        throw new Error("Unsupported block type");
    }
  }

  private hasPendingChanges(session: InternalSessionState): boolean {
    switch (session.type) {
      case "paragraph":
        return session.draftText !== session.baselineText;
      case "dialogue":
        return !equalTurns(session.draftTurns, session.baselineTurns);
      case "scene_boundary":
        return (
          session.draft.label !== session.baseline.label ||
          session.draft.summary !== session.baseline.summary ||
          session.draft.locationName !== session.baseline.locationName ||
          session.draft.timestamp !== session.baseline.timestamp ||
          session.draft.mood !== session.baseline.mood
        );
      case "metadata": {
        if (session.kind !== session.baselineKind) {
          return true;
        }
        const fields = getRelevantMetadataFields(session.kind);
        const block = this.resolveBlock(session.blockId);
        return fields.some((field) => session.draft[field] !== metadataFieldValue(block, field));
      }
      default:
        return false;
    }
  }

  startEditing(blockId: string) {
    if (this.state.isUpdatePending || this.state.isDeletePending) {
      return;
    }
    const current = this.state.activeSession;
    if (current && current.blockId === blockId) {
      return;
    }

    const begin = async () => {
      const block = this.resolveBlock(blockId);
      if (!isEditableBlock(block)) {
        return;
      }

      if (current && current.blockId !== blockId) {
        const hasChanges = this.hasPendingChanges(current);
        if (hasChanges) {
          const confirmed = await this.sideEffects.confirmDiscardChanges("switch");
          if (!confirmed) {
            return;
          }
        }
      }

      const session = this.createSessionFromBlock(block);
      this.state = {
        ...this.state,
        activeSession: session,
      } satisfies EditorEditingInternalState;
      this.notify();
    };

    void begin();
  }

  cancelEditing() {
    const current = this.state.activeSession;
    if (!current) {
      return;
    }
    const cancel = async () => {
      const hasChanges = this.hasPendingChanges(current);
      if (hasChanges) {
        const confirmed = await this.sideEffects.confirmDiscardChanges("cancel");
        if (!confirmed) {
          return;
        }
      }
      this.state = {
        ...this.state,
        activeSession: null,
      } satisfies EditorEditingInternalState;
      this.notify();
    };
    void cancel();
  }

  clearEditing() {
    if (!this.state.activeSession) {
      return;
    }
    this.state = {
      ...this.state,
      activeSession: null,
    } satisfies EditorEditingInternalState;
    this.notify();
  }

  private ensureActiveSessionOfType<T extends InternalSessionState["type"]>(
    type: T,
  ): Extract<InternalSessionState, { type: T }> | null {
    const session = this.state.activeSession;
    if (!session || session.type !== type) {
      return null;
    }
    return session as Extract<InternalSessionState, { type: T }>;
  }

  updateParagraphDraft(value: string) {
    const session = this.ensureActiveSessionOfType("paragraph");
    if (!session) {
      return;
    }
    if (session.draftText === value) {
      return;
    }
    session.draftText = value;
    this.paragraphSuggestions.handleDraftChange(session.blockId, value);
    this.notify();
  }

  changeDialogueTurn(
    turnId: string,
    field: keyof DialogueTurn,
    value: string,
  ) {
    const session = this.ensureActiveSessionOfType("dialogue");
    if (!session) {
      return;
    }
    session.draftTurns = session.draftTurns.map((turn) => {
      if (turn.id !== turnId) {
        return turn;
      }
      if (field === "stageDirection") {
        return { ...turn, [field]: value ? value : null };
      }
      return { ...turn, [field]: value };
    });
    this.notify();
  }

  addDialogueTurn() {
    const session = this.ensureActiveSessionOfType("dialogue");
    if (!session) {
      return;
    }
    session.draftTurns = [...session.draftTurns, createEmptyTurn()];
    this.notify();
  }

  removeDialogueTurn(turnId: string) {
    const session = this.ensureActiveSessionOfType("dialogue");
    if (!session) {
      return;
    }
    session.draftTurns = session.draftTurns.filter((turn) => turn.id !== turnId);
    this.notify();
  }

  updateSceneBoundaryField(field: SceneBoundaryEditableField, value: string) {
    const session = this.ensureActiveSessionOfType("scene_boundary");
    if (!session) {
      return;
    }
    session.draft = {
      ...session.draft,
      [field]: value,
    };
    this.notify();
  }

  updateMetadataField(field: MetadataFieldName, value: string) {
    const session = this.ensureActiveSessionOfType("metadata");
    if (!session) {
      return;
    }
    session.draft = {
      ...session.draft,
      [field]: value,
    };
    this.notify();
  }

  changeMetadataKind(kind: MetadataKindOption) {
    const session = this.ensureActiveSessionOfType("metadata");
    if (!session) {
      return;
    }
    session.kind = kind;
    this.notify();
  }

  private buildPayload(session: InternalSessionState): ChapterBlockUpdatePayload {
    switch (session.type) {
      case "paragraph":
        return buildParagraphPayload(session);
      case "dialogue":
        return buildDialoguePayload(session);
      case "scene_boundary":
        return buildSceneBoundaryPayload(session);
      case "metadata":
        return buildMetadataPayload(session);
      default:
        throw new Error(`Unsupported session type: ${(session as { type: string }).type}`);
    }
  }

  saveActiveBlock() {
    const session = this.state.activeSession;
    if (!session) {
      return;
    }
    if (this.state.isUpdatePending || this.state.isDeletePending) {
      return;
    }
    const hasChanges = this.hasPendingChanges(session);
    if (!hasChanges) {
      this.clearEditing();
      return;
    }
    const persist = async () => {
      try {
        this.setMutationState({ updatePending: true, deletePending: this.state.isDeletePending });
        await this.updateBlock({
          blockId: session.blockId,
          payload: this.buildPayload(session),
        });
        this.setMutationState({ updatePending: false, deletePending: this.state.isDeletePending });
        this.clearEditing();
      } catch (error) {
        this.setMutationState({ updatePending: false, deletePending: this.state.isDeletePending });
        this.sideEffects.notifyUpdateFailure(error);
      }
    };
    void persist();
  }

  async confirmDeleteActiveBlock(): Promise<void> {
    const session = this.state.activeSession;
    if (!session) {
      return;
    }
    if (this.state.isUpdatePending || this.state.isDeletePending) {
      return;
    }
    const confirmed = await this.sideEffects.confirmDeleteBlock();
    if (!confirmed) {
      return;
    }
    try {
      this.setMutationState({ updatePending: this.state.isUpdatePending, deletePending: true });
      await this.deleteBlock(session.blockId);
      this.setMutationState({ updatePending: this.state.isUpdatePending, deletePending: false });
      this.clearEditing();
    } catch (error) {
      this.setMutationState({ updatePending: this.state.isUpdatePending, deletePending: false });
      this.sideEffects.notifyUpdateFailure(error);
    }
  }

  syncActiveSession() {
    const session = this.state.activeSession;
    if (!session) {
      return;
    }
    const block = this.resolveBlock(session.blockId);
    if (!block || block.id !== session.blockId) {
      this.clearEditing();
      return;
    }
    switch (session.type) {
      case "paragraph": {
        session.baselineText = block.text ?? "";
        if (!this.hasPendingChanges(session)) {
          session.draftText = block.text ?? "";
        }
        break;
      }
      case "dialogue": {
        session.baselineTurns = cloneTurns(block.turns ?? []);
        if (!this.hasPendingChanges(session)) {
          session.draftTurns = cloneTurns(block.turns ?? []);
        }
        break;
      }
      case "scene_boundary": {
        const draft = toSceneBoundaryDraft(block);
        session.baseline = { ...draft };
        if (!this.hasPendingChanges(session)) {
          session.draft = { ...draft };
        }
        break;
      }
      case "metadata": {
        const draft = toMetadataDraft(block);
        const kind = normalizeMetadataKind(block.kind);
        session.baseline = { ...draft };
        session.baselineKind = kind;
        if (!this.hasPendingChanges(session)) {
          session.draft = { ...draft };
          session.kind = kind;
        }
        break;
      }
      default:
        break;
    }
    this.notify();
  }

  getActiveSession(): InternalSessionState | null {
    return this.state.activeSession;
  }

  getSuggestionState(blockId: string): ParagraphSuggestionSnapshot | null {
    return this.paragraphSuggestions.getSnapshotOrNull(blockId);
  }

  hasActivePendingChanges(): boolean {
    const session = this.state.activeSession;
    if (!session) {
      return false;
    }
    return this.hasPendingChanges(session);
  }

  getBlock(blockId: string): ChapterBlock | null {
    return this.blockResolver(blockId);
  }

  getChapterId(): string | null {
    return this.state.chapterId;
  }

  updateBlockDirect(args: {
    blockId: string;
    payload: ChapterBlockUpdatePayload;
  }): Promise<ChapterDetail> {
    return this.updateBlock(args);
  }

  getVersioningSideEffects(): Pick<EditorEditingSideEffects, "notifyUpdateFailure" | "confirmDeleteBlockVersion"> {
    return {
      notifyUpdateFailure: this.sideEffects.notifyUpdateFailure,
      confirmDeleteBlockVersion: this.sideEffects.confirmDeleteBlockVersion,
    };
  }
}
