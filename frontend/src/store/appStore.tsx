import React, { createContext, useContext, useMemo, useState } from 'react';

export type Toast = { id: number; text: string };

export type AppStoreState = {
  tokens: number;
  settingsOpen: boolean;
  toasts: Toast[];
};

export type AppStoreActions = {
  setTokens: (_n: number) => void;
  openSettings: () => void;
  closeSettings: () => void;
  showToast: (_text: string) => void;
  dismissToast: (_id: number) => void;
};

type AppStore = AppStoreState & AppStoreActions;

const AppStoreContext = createContext<AppStore | undefined>(undefined);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokensState] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [nextToastId, setNextToastId] = useState(1);

  const actions: AppStoreActions = {
    setTokens: (n) => setTokensState(Math.max(0, n | 0)),
    openSettings: () => setSettingsOpen(true),
    closeSettings: () => setSettingsOpen(false),
    showToast: (text: string) => {
      const clean = (text ?? '').trim();
      if (!clean) return;
      const id = nextToastId;
      setNextToastId((x) => x + 1);
      setToasts((ts) => [...ts, { id, text: clean }].slice(-2));
      window.setTimeout(() => {
        setToasts((ts) => ts.filter((t) => t.id !== id));
      }, 2500);
    },
    dismissToast: (id: number) => {
      setToasts((ts) => ts.filter((t) => t.id !== id));
    },
  };

  const value = useMemo<AppStore>(
    () => ({ tokens, settingsOpen, toasts, ...actions }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tokens, settingsOpen, toasts],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider');
  return ctx;
}
