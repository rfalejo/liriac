import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
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

type EditorSlice = {
  tokens: number;
  lastEditPos: number | null;
  setTokens: (_n: number) => void;
  setLastEditPos: (_n: number | null) => void;
};

type UiSlice = {
  settingsOpen: boolean;
  toasts: Toast[];
  openSettings: () => void;
  closeSettings: () => void;
  showToast: (_text: string) => void;
  dismissToast: (_id: number) => void;
};

type ContextSlice = {
  sections: ContextSection[];
  toggleSectionItem: (_sectionId: string, _itemId: string, _checked: boolean) => void;
  addSectionItem: (_sectionId: string, _item: ContextItem) => void;
  editSectionItem: (
    _sectionId: string,
    _itemId: string,
    _updater: (_prev: ContextItem) => ContextItem,
  ) => void;
  clearContext: () => void;
};

type AppState = {
  editor: EditorSlice;
  ui: UiSlice;
  context: ContextSlice;
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        editor: {
          tokens: 0,
          lastEditPos: null,
          setTokens: (n: number) =>
            set((s) => ({ editor: { ...s.editor, tokens: Math.max(0, n | 0) } })),
          setLastEditPos: (n: number | null) =>
            set((s) => ({ editor: { ...s.editor, lastEditPos: n } })),
        },
        ui: {
          settingsOpen: false,
          toasts: [],
          openSettings: () => set((s) => ({ ui: { ...s.ui, settingsOpen: true } })),
          closeSettings: () => set((s) => ({ ui: { ...s.ui, settingsOpen: false } })),
          showToast: (text: string) => {
            const clean = (text ?? '').trim();
            if (!clean) return;
            const id = Date.now() + Math.floor(Math.random() * 1000);
            set((s) => {
              const next = [...s.ui.toasts, { id, text: clean }].slice(-2);
              return { ui: { ...s.ui, toasts: next } };
            });
            // Auto-dismiss
            setTimeout(() => {
              const current = get().ui.toasts;
              if (current.some((t) => t.id === id)) {
                set((s) => ({
                  ui: { ...s.ui, toasts: s.ui.toasts.filter((t) => t.id !== id) },
                }));
              }
            }, 2500);
          },
          dismissToast: (id: number) =>
            set((s) => ({
              ui: { ...s.ui, toasts: s.ui.toasts.filter((t) => t.id !== id) },
            })),
        },
        context: {
          sections: INITIAL_SECTIONS,
          toggleSectionItem: (sectionId, itemId, checked) =>
            set((s) => ({
              context: {
                ...s.context,
                sections: toggleItemUtil(
                  s.context.sections,
                  sectionId,
                  itemId,
                  checked,
                ),
              },
            })),
          addSectionItem: (sectionId, item) =>
            set((s) => ({
              context: {
                ...s.context,
                sections: addItemUtil(s.context.sections, sectionId, item),
              },
            })),
          editSectionItem: (sectionId, itemId, updater) =>
            set((s) => ({
              context: {
                ...s.context,
                sections: editItemUtil(s.context.sections, sectionId, itemId, updater),
              },
            })),
          clearContext: () =>
            set((s) => ({
              context: {
                ...s.context,
                sections: s.context.sections.map((sec) => ({
                  ...sec,
                  items: sec.items.map((it) => ({ ...it, checked: false })),
                })),
              },
            })),
        },
      }),
      {
        name: 'liriac-store',
        // Persist only the context slice for now
        partialize: (s) => ({ context: s.context }),
      },
    ),
  ),
);
