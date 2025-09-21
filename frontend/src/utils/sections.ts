import type {
  ContextSection,
  ContextItem,
} from '../components/settings/ContextSectionList';

export function toggleItem(
  sections: ContextSection[],
  sectionId: string,
  itemId: string,
  checked: boolean,
): ContextSection[] {
  return sections.map((s) =>
    s.id !== sectionId
      ? s
      : {
          ...s,
          items: s.items.map((it) => (it.id === itemId ? { ...it, checked } : it)),
        },
  );
}

export function addItem(
  sections: ContextSection[],
  sectionId: string,
  item: ContextItem,
): ContextSection[] {
  return sections.map((s) =>
    s.id === sectionId ? { ...s, items: [item, ...s.items] } : s,
  );
}

export function editItem(
  sections: ContextSection[],
  sectionId: string,
  itemId: string,
  updater: (prev: ContextItem) => ContextItem,
): ContextSection[] {
  return sections.map((s) =>
    s.id !== sectionId
      ? s
      : {
          ...s,
          items: s.items.map((it) => (it.id === itemId ? updater(it) : it)),
        },
  );
}
