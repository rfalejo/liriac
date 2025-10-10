import { useMemo } from 'react';
import ContextSectionList, { type ContextItem } from './ContextSectionList';
import ContextTokenBar from './ContextTokenBar';
import ContextGlobalPrompt from './ContextGlobalPrompt';
import ItemEditorModal from './ItemEditorModal';
import { useContextModals } from '../../hooks/useContextModals';
import { useAppStore } from '../../store/appStore';

type CharacterDraft = {
  name: string;
  role?: string;
  summary?: string;
  checked?: boolean;
};

type WorldDraft = {
  title: string;
  summary?: string;
  facts?: string;
  checked?: boolean;
};

type StyleDraft = {
  description: string;
  checked?: boolean;
};

type Draft = CharacterDraft | WorldDraft | StyleDraft;

function isCharacterDraft(draft: Draft): draft is CharacterDraft {
  return typeof (draft as CharacterDraft).name === 'string';
}

function isWorldDraft(draft: Draft): draft is WorldDraft {
  return typeof (draft as WorldDraft).title === 'string';
}

function isStyleDraft(draft: Draft): draft is StyleDraft {
  return typeof (draft as StyleDraft).description === 'string';
}

export default function ContextEditorTab({ tokens }: { tokens: number }) {
  const sections = useAppStore((s) => s.context.sections);
  const toggleSectionItem = useAppStore((s) => s.context.toggleSectionItem);
  const addSectionItem = useAppStore((s) => s.context.addSectionItem);
  const editSectionItem = useAppStore((s) => s.context.editSectionItem);
  const showToast = useAppStore((s) => s.ui.showToast);

  const budget = 2000;

  // Sum checked context tokens + editor tokens
  const contextTokens = sections
    .flatMap((s) => s.items)
    .filter((it) => it.checked && typeof it.tokens === 'number')
    .reduce((acc, it) => acc + (it.tokens ?? 0), 0);
  const used = Math.max(0, tokens + contextTokens);

  const { character, world, style } = useContextModals();

  function handleToggle(sectionId: string, itemId: string, nextChecked: boolean) {
    toggleSectionItem(sectionId, itemId, nextChecked);
  }

  const charactersSection = useMemo(
    () => sections.find((s) => s.id === 'characters'),
    [sections],
  );
  const worldSection = useMemo(
    () => sections.find((s) => s.id === 'world'),
    [sections],
  );
  const styleSection = useMemo(
    () => sections.find((s) => s.id === 'styleTone'),
    [sections],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        {sections.map((section) => (
          <ContextSectionList
            key={section.id}
            section={section}
            onToggle={handleToggle}
            addButtonLabel={
              section.id === 'characters'
                ? 'Add character'
                : section.id === 'world'
                  ? 'Add world info'
                  : section.id === 'styleTone'
                    ? 'Add style/tone'
                    : undefined
            }
            onAdd={
              section.id === 'characters'
                ? () => character.openCreate()
                : section.id === 'world'
                  ? () => world.openCreate()
                  : section.id === 'styleTone'
                    ? () => style.openCreate()
                    : undefined
            }
            onEdit={
              section.id === 'characters'
                ? (_sid, itemId) => character.startEdit(itemId)
                : section.id === 'world'
                  ? (_sid, itemId) => world.startEdit(itemId)
                  : section.id === 'styleTone'
                    ? (_sid, itemId) => style.startEdit(itemId)
                    : undefined
            }
          />
        ))}
      </div>

      <div className="space-y-3">
        <ContextTokenBar used={used} budget={budget} />

        <ContextGlobalPrompt
          prompt="You are a helpful writing assistant. Follow the author’s intent, preserve facts, and avoid spoilers beyond the current scope."
          defaultOpen
          badgeCount={1}
        />

        <p className="text-xs text-[var(--muted)]">
          This is a mock. Interactions and persistence will be added next.
        </p>
      </div>

      <ItemEditorModal
        open={character.open}
        type="character"
        mode="create"
        onCancel={() => character.closeCreate()}
        onSave={(draft) => {
          if (!isCharacterDraft(draft)) return;
          const newItem = {
            id: `char-${Date.now()}`,
            type: 'character',
            name: draft.name.trim(),
            role: draft.role?.trim() || undefined,
            summary: draft.summary?.trim() || undefined,
            tokens: 80,
            checked: !!draft.checked,
          } as const;

          addSectionItem('characters', newItem);

          character.closeCreate();
          showToast('Character added.');
        }}
      />

      {character.editId && (
        <ItemEditorModal
          open={!!character.editId}
          type="character"
          mode="edit"
          initialValue={(function () {
            const item = charactersSection?.items.find(
              (it) => it.id === character.editId,
            );
            if (item && item.type === 'character') {
              return {
                name: item.name ?? '',
                role: item.role ?? '',
                summary: item.summary ?? '',
                checked: !!item.checked,
              };
            }
            return { name: '', role: '', summary: '', checked: true };
          })()}
          onCancel={() => character.endEdit()}
          onSave={(draft) => {
            if (!isCharacterDraft(draft)) return;
            editSectionItem(
              'characters',
              character.editId as string,
              (it: ContextItem) => {
                if (it.type === 'character') {
                  return {
                    ...it,
                    name: draft.name.trim(),
                    role: draft.role?.trim() || undefined,
                    summary: draft.summary?.trim() || undefined,
                    checked: !!draft.checked,
                  };
                }
                return it;
              },
            );

            character.endEdit();
            showToast('Character updated.');
          }}
        />
      )}

      <ItemEditorModal
        open={world.open}
        type="world"
        mode="create"
        onCancel={() => world.closeCreate()}
        onSave={(draft) => {
          if (!isWorldDraft(draft)) return;
          const title = draft.title.trim();
          if (!title) return;
          const newItem = {
            id: `wi-${Date.now()}`,
            type: 'world',
            title,
            summary: draft.summary?.trim() || undefined,
            facts: draft.facts?.trim() || undefined,
            tokens: 100,
            checked: !!draft.checked,
          } as const;

          addSectionItem('world', newItem);

          world.closeCreate();
          showToast('World info added.');
        }}
      />

      {world.editId && (
        <ItemEditorModal
          open={!!world.editId}
          type="world"
          mode="edit"
          initialValue={(function () {
            const item = worldSection?.items.find((it) => it.id === world.editId);
            if (item && item.type === 'world') {
              return {
                title: item.title ?? '',
                summary: item.summary ?? '',
                facts: item.facts ?? '',
                checked: !!item.checked,
              };
            }
            return { title: '', summary: '', facts: '', checked: true };
          })()}
          onCancel={() => world.endEdit()}
          onSave={(draft) => {
            if (!isWorldDraft(draft)) return;
            const title = draft.title.trim();
            const summary = draft.summary?.trim() ?? '';
            const facts = draft.facts?.trim() ?? '';
            editSectionItem('world', world.editId as string, (it: ContextItem) => {
              if (it.type === 'world') {
                return {
                  ...it,
                  title: title || it.title,
                  summary: summary || undefined,
                  facts: facts || undefined,
                  checked: !!draft.checked,
                };
              }
              return it;
            });

            world.endEdit();
            showToast('World info updated.');
          }}
        />
      )}

      <ItemEditorModal
        open={style.open}
        type="style"
        mode="create"
        onCancel={() => style.closeCreate()}
        onSave={(draft) => {
          if (!isStyleDraft(draft)) return;
          const desc = draft.description.trim();
          if (!desc) return;
          const newItem = {
            id: `st-${Date.now()}`,
            type: 'styleTone',
            description: desc,
            tokens: 40,
            checked: !!draft.checked,
          } as const;

          addSectionItem('styleTone', newItem);

          style.closeCreate();
          showToast('Style/tone item added.');
        }}
      />

      {style.editId && (
        <ItemEditorModal
          open={!!style.editId}
          type="style"
          mode="edit"
          initialValue={(function () {
            const item = styleSection?.items.find((it) => it.id === style.editId);
            if (item && item.type === 'styleTone') {
              return {
                description: item.description ?? '',
                checked: !!item.checked,
              };
            }
            return { description: '', checked: true };
          })()}
          onCancel={() => style.endEdit()}
          onSave={(draft) => {
            if (!isStyleDraft(draft)) return;
            const desc = draft.description.trim();
            editSectionItem('styleTone', style.editId as string, (it: ContextItem) => {
              if (it.type === 'styleTone') {
                return {
                  ...it,
                  description: desc || it.description,
                  checked: !!draft.checked,
                };
              }
              return it;
            });

            style.endEdit();
            showToast('Style/tone item updated.');
          }}
        />
      )}
    </div>
  );
}
