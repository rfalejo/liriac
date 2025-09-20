export type Shortcut = {
  keys: string; // e.g., "Shift+Tab", "Ctrl+S"
  label?: string; // short description to show next to kbd
  ariaLabel?: string; // accessible label if needed
  action?: () => void; // optional action handler
  disabled?: boolean;
};

export type EphemeralMessage = {
  text: string;
  tone?: 'info' | 'success' | 'warning' | 'error';
  timeoutMs?: number; // default 2000
};

export type EditorState = {
  modeLabel?: string; // e.g., "Mode: Manual"
  autosaveLabel?: string; // e.g., "Autosave: active (every 10s)"
  streaming?: {
    active: boolean;
    tokens?: number;
  };
  promptOpen?: boolean;
};

export type BottomContribution = {
  left?: string; // short breadcrumb/label
  middle?: string; // dynamic info; ephemeral messages override while visible
  rightShortcuts?: Shortcut[]; // 1-3 shortcuts
  editor?: EditorState; // editor-only additions
};

export type BottomBarAPI = {
  set: (_contrib: BottomContribution) => void;
  patch: (_contrib: Partial<BottomContribution>) => void;
  pushMessage: (_msg: EphemeralMessage) => void;
  togglePrompt: () => void;
  closePrompt: () => void;
  getState: () => BottomContribution;
};
