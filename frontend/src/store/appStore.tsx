/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useState } from 'react';
import type {
  ContextSection,
  ContextItem,
} from '../components/settings/ContextSectionList';
import { INITIAL_SECTIONS } from '../data/contextMock';
import {
  addItem as addItemUtil,
  editItem as editItemUtil,
  toggleItem as toggleItemUtil,
} from '../utils/sections';

export type Toast = { id: number; text: string };

export type AppStoreState = {
  tokens: number;
  settingsOpen: boolean;
  toasts: Toast[];
  sections: ContextSection[];
};

export type AppStoreActions = {
  setTokens: (_n: number) => void;
  openSettings: () => void;
  closeSettings: () => void;
  showToast: (_text: string) => void;
  dismissToast: (_id: number) => void;

  // Context editor actions
  toggleSectionItem: (_sectionId: string, _itemId: string, _checked: boolean) => void;
  addSectionItem: (_sectionId: string, _item: ContextItem) => void;
  editSectionItem: (
    _sectionId: string,
    _itemId: string,
    _updater: (_prev: ContextItem) => ContextItem,
  ) => void;
  clearContext: () => void;
};

type AppStore = AppStoreState & AppStoreActions;

const AppStoreContext = createContext<AppStore | undefined>(undefined);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokensState] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [nextToastId, setNextToastId] = useState(1);

  const [sections, setSections] = useState<ContextSection[]>(INITIAL_SECTIONS);

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

    toggleSectionItem: (sectionId, itemId, checked) => {
      setSections((prev) => toggleItemUtil(prev, sectionId, itemId, checked));
    },
    addSectionItem: (sectionId, item) => {
      setSections((prev) => addItemUtil(prev, sectionId, item));
    },
    editSectionItem: (sectionId, itemId, updater) => {
      setSections((prev) => editItemUtil(prev, sectionId, itemId, updater));
    },
    clearContext: () => {
      setSections((prev) =>
        prev.map((s) => ({
          ...s,
          items: s.items.map((it) => ({ ...it, checked: false })),
        })),
      );
      // Optionally also clear tokens related to context here later
    },
  };

  const value = useMemo<AppStore>(
    () => ({ tokens, settingsOpen, toasts, sections, ...actions }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tokens, settingsOpen, toasts, sections],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider');
  return ctx;
}
