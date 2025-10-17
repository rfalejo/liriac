export type SuggestionResult = {
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

export type ParagraphSuggestionHandlers = {
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
