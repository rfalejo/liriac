import { fetchParagraphSuggestionPrompt, requestParagraphSuggestion } from "../../../api/chapters";
import type {
  ParagraphSuggestionPromptResponse,
  ParagraphSuggestionResponse,
} from "../../../api/chapters";
import type { EditorEditingSideEffects } from "../hooks/editing/types";
import type { ChapterBlock } from "../types";
import type { ParagraphSessionState } from "./sessionTypes";
import {
  type ParagraphSuggestionContext,
  type ParagraphSuggestionSnapshot,
  type ParagraphSuggestionHandlers,
} from "./paragraphSuggestions.types";

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

type SnapshotUpdater = (prev: ParagraphSuggestionSnapshot) => ParagraphSuggestionSnapshot;

type ParagraphSuggestionManagerDeps = {
  getActiveParagraphSession: () => ParagraphSessionState | null;
  getChapterId: () => string | null;
  resolveBlock: (blockId: string) => ChapterBlock | null;
  notifyUpdateFailure: EditorEditingSideEffects["notifyUpdateFailure"];
  notifyStore: () => void;
};

function createUpdateSnapshot(
  manager: ParagraphSuggestionManager,
  blockId: string,
): (updater: SnapshotUpdater) => void {
  return (updater: SnapshotUpdater) => {
    const current = manager.getSnapshot(blockId);
    manager.setSnapshot(blockId, updater(current));
  };
}

function ensureClipboard(): typeof navigator.clipboard {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("Clipboard API unavailable");
  }
  return navigator.clipboard;
}

function buildHandlers(
  manager: ParagraphSuggestionManager,
  blockId: string,
): ParagraphSuggestionHandlers {
  const { deps } = manager;
  const updateSnapshot = createUpdateSnapshot(manager, blockId);

  const openPrompt = () => {
    const session = deps.getActiveParagraphSession();
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
    deps.notifyStore();
  };

  const closePrompt = () => {
    const snapshot = manager.getSnapshot(blockId);
    if (snapshot.isRequestPending || snapshot.isCopyPending) {
      return;
    }
    manager.reset(blockId);
    deps.notifyStore();
  };

  const submit = async () => {
    const session = deps.getActiveParagraphSession();
    const snapshot = manager.getSnapshot(blockId);
    if (!session || session.type !== "paragraph" || session.blockId !== blockId) {
      return;
    }
    const block = deps.resolveBlock(blockId);
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
      deps.notifyStore();
      return;
    }

    updateSnapshot((prev) => ({
      ...prev,
      isRequestPending: true,
      draftSnapshot: session.draftText,
      error: null,
    }));
    deps.notifyStore();

    try {
      const chapterId = deps.getChapterId();
      if (!chapterId) {
        updateSnapshot((prev) => ({
          ...prev,
          isRequestPending: false,
          draftSnapshot: null,
          error: "No pudimos generar la sugerencia. Inténtalo de nuevo.",
        }));
        deps.notifyStore();
        return;
      }
      const response: ParagraphSuggestionResponse = await requestParagraphSuggestion({
        chapterId,
        blockId,
        instructions: trimmed,
      });
      manager.setSnapshot(blockId, {
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
      });
      deps.notifyStore();
    } catch (error) {
      updateSnapshot((prev) => ({
        ...prev,
        error: "No pudimos generar la sugerencia. Inténtalo de nuevo.",
        isRequestPending: false,
        draftSnapshot: null,
      }));
      deps.notifyStore();
      deps.notifyUpdateFailure(error);
    }
  };

  const applyResult = () => {
    const session = deps.getActiveParagraphSession();
    if (!session || session.type !== "paragraph" || session.blockId !== blockId) {
      return;
    }
    const snapshot = manager.getSnapshot(blockId);
    const result = snapshot.result;
    if (!result) {
      return;
    }
    session.draftText = result.text;
    updateSnapshot((prev) => ({
      ...prev,
      result: {
        ...prev.result!,
        isApplied: true,
      },
      error: null,
    }));
    deps.notifyStore();
  };

  const dismissResult = () => {
    const session = deps.getActiveParagraphSession();
    if (!session || session.type !== "paragraph" || session.blockId !== blockId) {
      return;
    }
    const snapshot = manager.getSnapshot(blockId);
    const wasApplied = snapshot.result?.isApplied ?? false;
    const draftSnapshot = snapshot.draftSnapshot;
    manager.reset(blockId);
    if (wasApplied && draftSnapshot != null) {
      session.draftText = draftSnapshot;
    }
    deps.notifyStore();
  };

  const copyPrompt = async () => {
    const session = deps.getActiveParagraphSession();
    const snapshot = manager.getSnapshot(blockId);
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
    deps.notifyStore();
    try {
      const chapterId = deps.getChapterId();
      if (!chapterId) {
        updateSnapshot((prev) => ({
          ...prev,
          isCopyPending: false,
          copyStatus: "idle",
          error: "No pudimos copiar el prompt. Inténtalo de nuevo.",
        }));
        deps.notifyStore();
        return;
      }
      const response: ParagraphSuggestionPromptResponse = await fetchParagraphSuggestionPrompt({
        chapterId,
        blockId,
        instructions: trimmed,
      });
      if (!response.prompt) {
        throw new Error("Empty prompt response");
      }
      const clipboard = ensureClipboard();
      await clipboard.writeText(response.prompt);
      updateSnapshot((prev) => ({
        ...prev,
        isCopyPending: false,
        copyStatus: "copied",
        error: null,
      }));
      deps.notifyStore();
    } catch (error) {
      updateSnapshot((prev) => ({
        ...prev,
        isCopyPending: false,
        copyStatus: "idle",
        error: "No pudimos copiar el prompt. Inténtalo de nuevo.",
      }));
      deps.notifyStore();
      deps.notifyUpdateFailure(error);
    }
  };

  const setInstructions = (value: string) => {
    updateSnapshot((prev) => ({
      ...prev,
      instructions: value,
      copyStatus: prev.promptOpen ? "idle" : prev.copyStatus,
    }));
    deps.notifyStore();
  };

  return {
    openPrompt,
    closePrompt,
    submit,
    applyResult,
    dismissResult,
    copyPrompt,
    setInstructions,
  } satisfies ParagraphSuggestionHandlers;
}

export class ParagraphSuggestionManager {
  private snapshots = new Map<string, ParagraphSuggestionSnapshot>();

  constructor(public readonly deps: ParagraphSuggestionManagerDeps) {}

  reset(blockId: string) {
    this.snapshots.set(blockId, { ...EMPTY_PARAGRAPH_SUGGESTION });
  }

  setSnapshot(blockId: string, snapshot: ParagraphSuggestionSnapshot) {
    this.snapshots.set(blockId, snapshot);
  }

  getSnapshot(blockId: string): ParagraphSuggestionSnapshot {
    if (!this.snapshots.has(blockId)) {
      this.reset(blockId);
    }
    return this.snapshots.get(blockId)!;
  }

  getContext(blockId: string): ParagraphSuggestionContext {
    this.getSnapshot(blockId);
    const handlers = buildHandlers(this, blockId);
    return {
      getSnapshot: () => this.getSnapshot(blockId),
      handlers,
    } satisfies ParagraphSuggestionContext;
  }

  handleDraftChange(blockId: string, draftValue: string) {
    const snapshot = this.snapshots.get(blockId);
    if (!snapshot || !snapshot.usesDraftAsPrompt) {
      return;
    }
    this.snapshots.set(blockId, {
      ...snapshot,
      instructions: draftValue,
    });
  }

  getSnapshotOrNull(blockId: string): ParagraphSuggestionSnapshot | null {
    return this.snapshots.get(blockId) ?? null;
  }
}
