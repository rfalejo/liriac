import type {
  ChapterBlockUpdatePayload,
  ChapterDetail,
} from "../../../api/chapters";
import type { ChapterBlock } from "../types";
import type { DialogueTurn } from "../types";
import type {
  MetadataDraft,
  MetadataEditableField,
  MetadataKindOption,
  SceneBoundaryDraft,
  SceneBoundaryEditableField,
} from "../types";
import type { EditorEditingSideEffects } from "../hooks/editing/types";
import { cloneTurns, createEmptyTurn, equalTurns } from "../utils/dialogueTurns";
import { requestParagraphSuggestion, fetchParagraphSuggestionPrompt } from "../../../api/chapters";
import type {
  ParagraphSuggestionResponse,
  ParagraphSuggestionPromptResponse,
} from "../../../api/chapters";

const EMPTY_SCENE_BOUNDARY: SceneBoundaryDraft = {
  label: "",
  summary: "",
  locationName: "",
  timestamp: "",
  mood: "",
};

const EMPTY_METADATA: MetadataDraft = {
  title: "",
  subtitle: "",
  epigraph: "",
  epigraphAttribution: "",
  context: "",
  text: "",
  povCharacterName: "",
  timelineMarker: "",
  locationName: "",
  themeTags: "",
};

type EditableChapterBlock = ChapterBlock & {
  type: "paragraph" | "dialogue" | "scene_boundary" | "metadata";
};

export type DialogueSessionState = {
  type: "dialogue";
  blockId: string;
  draftTurns: DialogueTurn[];
  baselineTurns: DialogueTurn[];
};

export type SceneBoundarySessionState = {
  type: "scene_boundary";
  blockId: string;
  draft: SceneBoundaryDraft;
  baseline: SceneBoundaryDraft;
};

export type MetadataSessionState = {
  type: "metadata";
  blockId: string;
  draft: MetadataDraft;
  baseline: MetadataDraft;
  kind: MetadataKindOption;
  baselineKind: MetadataKindOption;
};

type EditorEditingInternalState = EditorEditingStoreSnapshot & {
  chapterId: string | null;
};

type BlockResolver = (blockId: string) => ChapterBlock | null;

type UpdateBlockFn = (args: {
  blockId: string;
  payload: ChapterBlockUpdatePayload;
}) => Promise<ChapterDetail>;

type DeleteBlockFn = (blockId: string) => Promise<ChapterDetail>;

function isEditableBlock(block: ChapterBlock | null): block is EditableChapterBlock {
  if (!block) {
    return false;
  }
  return (
    block.type === "paragraph" ||
    block.type === "dialogue" ||
    block.type === "scene_boundary" ||
    block.type === "metadata"
  );
}

function toSceneBoundaryDraft(block: ChapterBlock | null): SceneBoundaryDraft {
  if (!block || block.type !== "scene_boundary") {
    return { ...EMPTY_SCENE_BOUNDARY };
  }
  return {
    label: block.label ?? "",
    summary: block.summary ?? "",
    locationName:
      block.sceneDetails?.locationName ?? block.locationName ?? "",
    timestamp: block.sceneDetails?.timestamp ?? block.timestamp ?? "",
    mood: block.sceneDetails?.mood ?? block.mood ?? "",
  } satisfies SceneBoundaryDraft;
}

function normalizeMetadataKind(kind: unknown): MetadataKindOption {
  if (kind === "chapter_header" || kind === "context" || kind === "metadata") {
    return kind;
  }
  return "metadata";
}

function toMetadataDraft(block: ChapterBlock | null): MetadataDraft {
  if (!block || block.type !== "metadata") {
    return { ...EMPTY_METADATA };
  }

  const themeTags =
    (block.narrativeContext?.themeTags ?? block.themeTags ?? [])
      .filter((tag): tag is string => Boolean(tag && tag.trim().length > 0))
      .join(", ");

  return {
    title: block.title ?? "",
    subtitle: block.subtitle ?? "",
    epigraph: block.epigraph ?? "",
    epigraphAttribution: block.epigraphAttribution ?? "",
    context: block.context ?? "",
    text: block.text ?? "",
    povCharacterName:
      block.narrativeContext?.povCharacterName ?? block.povCharacterName ?? "",
    timelineMarker:
      block.narrativeContext?.timelineMarker ?? block.timelineMarker ?? "",
    locationName:
      block.narrativeContext?.locationName ?? block.locationName ?? "",
    themeTags,
  } satisfies MetadataDraft;
}

function metadataFieldValue(
  block: ChapterBlock | null,
  field: MetadataEditableField,
): string {
  if (!block || block.type !== "metadata") {
    return "";
  }
  switch (field) {
    case "title":
      return block.title ?? "";
    case "subtitle":
      return block.subtitle ?? "";
    case "epigraph":
      return block.epigraph ?? "";
    case "epigraphAttribution":
      return block.epigraphAttribution ?? "";
    case "context":
      return block.context ?? "";
    case "povCharacterName":
      return (
        block.narrativeContext?.povCharacterName ??
        block.povCharacterName ??
        ""
      );
    case "timelineMarker":
      return (
        block.narrativeContext?.timelineMarker ??
        block.timelineMarker ??
        ""
      );
    case "locationName":
      return (
        block.narrativeContext?.locationName ??
        block.locationName ??
        block.narrativeContext?.locationId ??
        block.locationId ??
        ""
      );
    case "themeTags":
      return (
        block.narrativeContext?.themeTags ?? block.themeTags ?? []
      )
        .filter((tag): tag is string => Boolean(tag && tag.trim().length > 0))
        .join(", ");
    case "text":
    default:
      return block.text ?? "";
  }
}

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

type SuggestionResult = {
  instructions: string;
  text: string;
  isApplied: boolean;
};

export type ParagraphSuggestionSnapshot = {
  promptOpen: boolean;
  instructions: string;
  usesDraftAsPrompt: boolean;
  draftSnapshot: string | null;
  result: SuggestionResult | null;
  error: string | null;
  copyStatus: "idle" | "pending" | "copied";
  isRequestPending: boolean;
  isCopyPending: boolean;
};

const EMPTY_PARAGRAPH_SUGGESTION: ParagraphSuggestionSnapshot = {
  promptOpen: false,
  instructions: "",
  usesDraftAsPrompt: false,
  draftSnapshot: null,
  result: null,
  error: null,
  copyStatus: "idle",
  isRequestPending: false,
  isCopyPending: false,
};

type EditorEditingStoreSnapshot = {
  activeSession: InternalSessionState | null;
  isUpdatePending: boolean;
  isDeletePending: boolean;
};

type MetadataFieldName = MetadataEditableField;

type ParagraphSuggestionHandlers = {
  openPrompt: () => void;
  closePrompt: () => void;
  submit: () => Promise<void>;
  applyResult: () => void;
  dismissResult: () => void;
  copyPrompt: () => Promise<void>;
  setInstructions: (value: string) => void;
};

export type ParagraphSuggestionContext = {
  getSnapshot: () => ParagraphSuggestionSnapshot;
  handlers: ParagraphSuggestionHandlers;
};

export type ParagraphSessionState = {
  type: "paragraph";
  blockId: string;
  draftText: string;
  baselineText: string;
  suggestionContext: ParagraphSuggestionContext;
};

type InternalSessionState =
  | ParagraphSessionState
  | DialogueSessionState
  | SceneBoundarySessionState
  | MetadataSessionState;

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
  private paragraphSuggestions: Map<string, ParagraphSuggestionSnapshot> =
    new Map();

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

  private ensureParagraphSuggestionContext(blockId: string) {
    if (!this.paragraphSuggestions.has(blockId)) {
      this.paragraphSuggestions.set(blockId, {
        ...EMPTY_PARAGRAPH_SUGGESTION,
      });
    }
  }

  private buildParagraphSuggestionContext(blockId: string): ParagraphSuggestionContext {
    this.ensureParagraphSuggestionContext(blockId);
    const getSnapshot = () => this.paragraphSuggestions.get(blockId)!;
    const updateSnapshot = (updater: (prev: ParagraphSuggestionSnapshot) => ParagraphSuggestionSnapshot) => {
      const current = getSnapshot();
      this.paragraphSuggestions.set(blockId, updater(current));
    };

    const openPrompt = () => {
      const session = this.state.activeSession;
      if (!session || session.type !== "paragraph" || session.blockId !== blockId) {
        return;
      }
      const draftText = session.draftText;
      const shouldUseDraft = draftText.trim().length === 0;
      updateSnapshot((prev) => ({
        ...prev,
        promptOpen: true,
        usesDraftAsPrompt: shouldUseDraft,
        instructions: shouldUseDraft ? draftText : prev.instructions,
        error: null,
        copyStatus: "idle",
      }));
      this.notify();
    };

    const closePrompt = () => {
      const snapshot = getSnapshot();
      if (snapshot.isRequestPending || snapshot.isCopyPending) {
        return;
      }
      updateSnapshot(() => ({
        ...EMPTY_PARAGRAPH_SUGGESTION,
      }));
      this.notify();
    };

    const submit = async () => {
      const session = this.state.activeSession;
      const snapshot = getSnapshot();
      if (!session || session.type !== "paragraph" || session.blockId !== blockId) {
        return;
      }
      const block = this.resolveBlock(blockId);
      if (!block || block.type !== "paragraph") {
        return;
      }
      const instructions = snapshot.usesDraftAsPrompt
        ? session.draftText
        : snapshot.instructions;
      const trimmed = instructions.trim();
      if (!trimmed) {
        updateSnapshot((prev) => ({
          ...prev,
          error: "Añade instrucciones para generar la sugerencia.",
        }));
        this.notify();
        return;
      }

      updateSnapshot((prev) => ({
        ...prev,
        isRequestPending: true,
        draftSnapshot: session.draftText,
        error: null,
      }));
      this.notify();

      try {
        if (!this.state.chapterId) {
          updateSnapshot((prev) => ({
            ...prev,
            isRequestPending: false,
            draftSnapshot: null,
            error: "No pudimos generar la sugerencia. Inténtalo de nuevo.",
          }));
          this.notify();
          return;
        }
        const response: ParagraphSuggestionResponse = await requestParagraphSuggestion({
          chapterId: this.state.chapterId ?? "",
          blockId,
          instructions: trimmed,
        });
        updateSnapshot(() => ({
          promptOpen: false,
          instructions: trimmed,
          usesDraftAsPrompt: false,
          draftSnapshot: session.draftText,
          result: {
            instructions: trimmed,
            text: response.paragraphSuggestion,
            isApplied: false,
          },
          error: null,
          copyStatus: "idle",
          isRequestPending: false,
          isCopyPending: false,
        }));
        this.notify();
      } catch (error) {
        updateSnapshot((prev) => ({
          ...prev,
          error: "No pudimos generar la sugerencia. Inténtalo de nuevo.",
          isRequestPending: false,
          draftSnapshot: null,
        }));
        this.notify();
        this.sideEffects.notifyUpdateFailure(error);
      }
    };

    const applyResult = () => {
      const session = this.state.activeSession;
      if (!session || session.type !== "paragraph" || session.blockId !== blockId) {
        return;
      }
      const snapshot = getSnapshot();
      const result = snapshot.result;
      if (!result) {
        return;
      }
      session.draftText = result.text;
      updateSnapshot((prev) => ({
        ...prev,
        result: {
          ...result,
          isApplied: true,
        },
        error: null,
      }));
      this.notify();
    };

    const dismissResult = () => {
      const session = this.state.activeSession;
      if (!session || session.type !== "paragraph" || session.blockId !== blockId) {
        return;
      }
      const snapshot = getSnapshot();
      const wasApplied = snapshot.result?.isApplied ?? false;
      const draftSnapshot = snapshot.draftSnapshot;
      updateSnapshot(() => ({
        ...EMPTY_PARAGRAPH_SUGGESTION,
      }));
      if (wasApplied && draftSnapshot != null) {
        session.draftText = draftSnapshot;
      }
      this.notify();
    };

    const copyPrompt = async () => {
      const session = this.state.activeSession;
      const snapshot = getSnapshot();
      if (!session || session.type !== "paragraph" || session.blockId !== blockId) {
        return;
      }
      if (snapshot.isCopyPending) {
        return;
      }
      const instructions = snapshot.usesDraftAsPrompt
        ? session.draftText
        : snapshot.instructions;
      const trimmed = instructions.trim();
      if (!trimmed) {
        return;
      }
      updateSnapshot((prev) => ({
        ...prev,
        isCopyPending: true,
        copyStatus: "pending",
      }));
      this.notify();
      try {
        if (!this.state.chapterId) {
          updateSnapshot((prev) => ({
            ...prev,
            isCopyPending: false,
            copyStatus: "idle",
            error: "No pudimos copiar el prompt. Inténtalo de nuevo.",
          }));
          this.notify();
          return;
        }
        const response: ParagraphSuggestionPromptResponse = await fetchParagraphSuggestionPrompt({
          chapterId: this.state.chapterId ?? "",
          blockId,
          instructions: trimmed,
        });
        if (!response.prompt) {
          throw new Error("Empty prompt response");
        }
        if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
          throw new Error("Clipboard API unavailable");
        }
        await navigator.clipboard.writeText(response.prompt);
        updateSnapshot((prev) => ({
          ...prev,
          isCopyPending: false,
          copyStatus: "copied",
          error: null,
        }));
        this.notify();
      } catch (error) {
        updateSnapshot((prev) => ({
          ...prev,
          isCopyPending: false,
          copyStatus: "idle",
          error: "No pudimos copiar el prompt. Inténtalo de nuevo.",
        }));
        this.notify();
        this.sideEffects.notifyUpdateFailure(error);
      }
    };

    const setInstructions = (value: string) => {
      updateSnapshot((prev) => ({
        ...prev,
        instructions: value,
        copyStatus: prev.promptOpen ? "idle" : prev.copyStatus,
      }));
      this.notify();
    };

    return {
      getSnapshot,
      handlers: {
        openPrompt,
        closePrompt,
        submit,
        applyResult,
        dismissResult,
        copyPrompt,
        setInstructions,
      },
    } satisfies ParagraphSuggestionContext;
  }

  private buildParagraphSession(block: ChapterBlock): ParagraphSessionState {
    if (block.type !== "paragraph") {
      throw new Error("Attempted to build paragraph session for non-paragraph block");
    }
    this.paragraphSuggestions.set(block.id, { ...EMPTY_PARAGRAPH_SUGGESTION });
    const context = this.buildParagraphSuggestionContext(block.id);
    return {
      type: "paragraph",
      blockId: block.id,
      draftText: block.text ?? "",
      baselineText: block.text ?? "",
      suggestionContext: context,
    } satisfies ParagraphSessionState;
  }

  private buildDialogueSession(block: ChapterBlock): DialogueSessionState {
    if (block.type !== "dialogue") {
      throw new Error("Attempted to build dialogue session for non-dialogue block");
    }
    const turns = cloneTurns(block.turns ?? []);
    return {
      type: "dialogue",
      blockId: block.id,
      draftTurns: turns,
      baselineTurns: cloneTurns(block.turns ?? []),
    } satisfies DialogueSessionState;
  }

  private buildSceneBoundarySession(block: ChapterBlock): SceneBoundarySessionState {
    if (block.type !== "scene_boundary") {
      throw new Error("Attempted to build scene boundary session for incompatible block");
    }
    const draft = toSceneBoundaryDraft(block);
    return {
      type: "scene_boundary",
      blockId: block.id,
      draft,
      baseline: { ...draft },
    } satisfies SceneBoundarySessionState;
  }

  private buildMetadataSession(block: ChapterBlock): MetadataSessionState {
    if (block.type !== "metadata") {
      throw new Error("Attempted to build metadata session for incompatible block");
    }
    const draft = toMetadataDraft(block);
    const kind = normalizeMetadataKind(block.kind);
    return {
      type: "metadata",
      blockId: block.id,
      draft,
      baseline: { ...draft },
      kind,
      baselineKind: kind,
    } satisfies MetadataSessionState;
  }

  private createSessionFromBlock(block: EditableChapterBlock): InternalSessionState {
    switch (block.type) {
      case "paragraph":
        return this.buildParagraphSession(block);
      case "dialogue":
        return this.buildDialogueSession(block);
      case "scene_boundary":
        return this.buildSceneBoundarySession(block);
      case "metadata":
        return this.buildMetadataSession(block);
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
        const fields = this.relevantMetadataFields(session.kind);
        const block = this.resolveBlock(session.blockId);
        return fields.some((field) => session.draft[field] !== metadataFieldValue(block, field));
      }
      default:
        return false;
    }
  }

  private relevantMetadataFields(kind: MetadataKindOption): MetadataEditableField[] {
    if (kind === "chapter_header") {
      return ["title", "subtitle", "epigraph", "epigraphAttribution"];
    }
    if (kind === "context") {
      return ["context", "povCharacterName", "timelineMarker", "locationName", "themeTags"];
    }
    return ["text"];
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
    const suggestion = this.paragraphSuggestions.get(session.blockId);
    if (suggestion?.usesDraftAsPrompt) {
      this.paragraphSuggestions.set(session.blockId, {
        ...suggestion,
        instructions: value,
      });
    }
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
    } satisfies SceneBoundaryDraft;
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
    } satisfies MetadataDraft;
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

  private buildParagraphPayload(session: ParagraphSessionState): ChapterBlockUpdatePayload {
    return {
      text: session.draftText,
    } satisfies ChapterBlockUpdatePayload;
  }

  private buildDialoguePayload(session: DialogueSessionState): ChapterBlockUpdatePayload {
    return {
      turns: session.draftTurns,
    } satisfies ChapterBlockUpdatePayload;
  }

  private buildSceneBoundaryPayload(session: SceneBoundarySessionState): ChapterBlockUpdatePayload {
    return {
      label: toNullable(session.draft.label),
      summary: toNullable(session.draft.summary),
      sceneDetails: {
        locationName: toNullable(session.draft.locationName),
        timestamp: toNullable(session.draft.timestamp),
        mood: toNullable(session.draft.mood),
      },
    } satisfies ChapterBlockUpdatePayload;
  }

  private buildMetadataPayload(session: MetadataSessionState): ChapterBlockUpdatePayload {
    const payload: ChapterBlockUpdatePayload = {
      kind: session.kind,
    };

    if (session.kind === "chapter_header") {
      payload.title = toNullable(session.draft.title);
      payload.subtitle = toNullable(session.draft.subtitle);
      payload.epigraph = toNullable(session.draft.epigraph);
      payload.epigraphAttribution = toNullable(session.draft.epigraphAttribution);
      payload.context = null;
      payload.text = "";
      payload.narrativeContext = null;
      payload.povCharacterName = null;
      payload.timelineMarker = null;
      payload.locationName = null;
      payload.themeTags = [];
    } else if (session.kind === "context") {
      payload.context = toNullable(session.draft.context);
      payload.title = null;
      payload.subtitle = null;
      payload.epigraph = null;
      payload.epigraphAttribution = null;
      payload.text = "";
      const normalizedTags = session.draft.themeTags
        .split(",")
        .map((entry: string) => entry.trim())
        .filter((entry: string) => entry.length > 0);
      payload.narrativeContext = {
        povCharacterName: toNullable(session.draft.povCharacterName),
        timelineMarker: toNullable(session.draft.timelineMarker),
        locationName: toNullable(session.draft.locationName),
        themeTags: normalizedTags,
      };
      payload.povCharacterName = null;
      payload.timelineMarker = null;
      payload.locationName = null;
      payload.themeTags = normalizedTags;
    } else {
      payload.text = session.draft.text;
      payload.title = null;
      payload.subtitle = null;
      payload.epigraph = null;
      payload.epigraphAttribution = null;
      payload.context = null;
      payload.narrativeContext = null;
      payload.povCharacterName = null;
      payload.timelineMarker = null;
      payload.locationName = null;
      payload.themeTags = [];
    }

    return payload;
  }

  private buildPayload(session: InternalSessionState): ChapterBlockUpdatePayload {
    switch (session.type) {
      case "paragraph":
        return this.buildParagraphPayload(session);
      case "dialogue":
        return this.buildDialoguePayload(session);
      case "scene_boundary":
        return this.buildSceneBoundaryPayload(session);
      case "metadata":
        return this.buildMetadataPayload(session);
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
    return this.paragraphSuggestions.get(blockId) ?? null;
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
