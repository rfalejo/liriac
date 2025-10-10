import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  ContextSection,
  ContextItem,
} from '../components/settings/ContextSectionList';
import {
  addItem as addItemUtil,
  editItem as editItemUtil,
  toggleItem as toggleItemUtil,
} from '../utils/sections';

export type Toast = { id: number; text: string };

type EditorSlice = {
  tokens: number;
  lastEditPos: number | null;
  initialContent: string;
  setTokens: (_n: number) => void;
  setLastEditPos: (_n: number | null) => void;
  setInitialContent: (_value: string) => void;
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
  setSections: (_sections: ContextSection[]) => void;
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
          initialContent: '',
          setTokens: (n: number) =>
            set((s) => ({ editor: { ...s.editor, tokens: Math.max(0, n | 0) } })),
          setLastEditPos: (n: number | null) =>
            set((s) => ({ editor: { ...s.editor, lastEditPos: n } })),
          setInitialContent: (value: string) =>
            set((s) => ({ editor: { ...s.editor, initialContent: value } })),
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
          sections: [],
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
          setSections: (sections) =>
            set((s) => ({
              context: {
                ...s.context,
                sections,
              },
            })),
        },
      }),
      {
        name: 'liriac-store',
        version: 3,
        merge: (persistedState, currentState) => {
          const persisted = persistedState as {
            context?: {
              sections?: ContextSection[];
            };
          } | null;

          if (!persisted || !persisted.context) {
            return currentState;
          }

          return {
            ...currentState,
            context: {
              ...currentState.context,
              sections: persisted.context.sections ?? currentState.context.sections,
            },
          };
        },
        migrate: (state: unknown, version: number): unknown => {
          const s = state as {
            context?: {
              sections?: Array<{
                id?: string;
                items?: Array<Record<string, unknown>>;
              }>;
            };
          } | null;

          if (!s || !s.context) {
            return { context: { sections: [] } };
          }

          const sections = s.context.sections ?? [];

          if (version >= 2) {
            return { context: { sections } };
          }

          try {
            const mapped = sections.map((sec) => {
              const secId = sec.id ?? '';
              const items = (sec.items ?? []).map((raw) => {
                const it = raw as Record<string, unknown>;
                if (it && typeof it === 'object' && 'type' in it) return it;

                const label = String((it as { label?: unknown }).label ?? '');
                const base = {
                  id: (it as { id?: unknown }).id as string | undefined,
                  tokens: (it as { tokens?: unknown }).tokens as number | undefined,
                  checked: (it as { checked?: unknown }).checked as boolean | undefined,
                  disabled: (it as { disabled?: unknown }).disabled as
                    | boolean
                    | undefined,
                };

                if (secId === 'characters') {
                  const parts = label.split('—').map((ss) => ss.trim());
                  const namePart = parts[0] || label;
                  const rolePart = parts[1] || undefined;
                  return {
                    ...base,
                    type: 'character',
                    name: namePart,
                    role: rolePart,
                    summary: undefined,
                  };
                }
                if (secId === 'world') {
                  return {
                    ...base,
                    type: 'world',
                    title: label,
                    summary: undefined,
                    facts: undefined,
                  };
                }
                if (secId === 'styleTone') {
                  return {
                    ...base,
                    type: 'styleTone',
                    description: label,
                  };
                }
                if (secId === 'chapters') {
                  return {
                    ...base,
                    type: 'chapter',
                    title: label,
                  };
                }
                return it;
              });
              return { ...sec, items };
            });
            return { context: { sections: mapped } };
          } catch {
            return { context: { sections } };
          }
        },
        // Persist only the context slice for now
        partialize: (s) => ({ context: { sections: s.context.sections } }),
      },
    ),
  ),
);
