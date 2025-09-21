import { useCallback, useState } from 'react';
import ContextSectionList, { type ContextSection } from './ContextSectionList';
import ContextTokenBar from './ContextTokenBar';
import ContextGlobalPrompt from './ContextGlobalPrompt';
import ContextStyleTonePanel from './ContextStyleTonePanel';
import ItemEditorModal from './ItemEditorModal';
import { INITIAL_SECTIONS } from '../../data/contextMock';
import { addItem, editItem, toggleItem } from '../../utils/sections';
import { useContextModals } from '../../hooks/useContextModals';

export default function ContextEditorTab({ tokens }: { tokens: number }) {
  const [sections, setSections] = useState<ContextSection[]>(INITIAL_SECTIONS);

  const budget = 2000;
  const used = Math.max(0, tokens);

  const { character, world } = useContextModals();

  const handleToggle = useCallback((sectionId: string, itemId: string, nextChecked: boolean) => {
    setSections((prev) => toggleItem(prev, sectionId, itemId, nextChecked));
  }, []);

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
                : undefined
            }
            onAdd={
              section.id === 'characters'
                ? () => character.openCreate()
                : section.id === 'world'
                ? () => world.openCreate()
                : undefined
            }
            onEdit={
              section.id === 'characters'
                ? (_sid, itemId) => character.startEdit(itemId)
                : section.id === 'world'
                ? (_sid, itemId) => world.startEdit(itemId)
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

        <ContextStyleTonePanel
          defaultOpen={false}
          items={[
            { id: 'sg-house', description: 'House style: concise, sensory details', checked: true },
          ]}
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
          const label =
            draft.role && (draft.role as string).trim()
              ? `${(draft.name as string).trim()} — ${(draft.role as string).trim()}`
              : (draft.name as string).trim();
          const newItem = {
            id: `char-${Date.now()}`,
            label,
            tokens: 80,
            checked: !!draft.checked,
          } as const;

          setSections((prev) => addItem(prev, 'characters', newItem));

          character.closeCreate();
          window.dispatchEvent(
            new CustomEvent('toast:show', { detail: { text: 'Character added.' } }),
          );
        }}
      />

      {character.editId && (
        <ItemEditorModal
          open={!!character.editId}
          type="character"
          mode="edit"
          initialValue={() => {
            const item =
              sections.find((s) => s.id === 'characters')?.items.find((it) => it.id === character.editId);
            if (!item) return { name: '', role: '', summary: '', checked: true };
            const [name, rolePart] = item.label.split('—').map((s) => s.trim());
            return {
              name: name ?? '',
              role: rolePart ?? '',
              summary: '',
              checked: !!item.checked,
            };
          }}
          onCancel={() => character.endEdit()}
          onSave={(draft: any) => {
            const label =
              draft.role && draft.role.trim()
                ? `${draft.name.trim()} — ${draft.role.trim()}`
                : draft.name.trim();

            setSections((prev) =>
              editItem(prev, 'characters', character.editId as string, (it) => ({
                ...it,
                label,
                checked: !!draft.checked,
              })),
            );

            character.endEdit();
            window.dispatchEvent(
              new CustomEvent('toast:show', { detail: { text: 'Character updated.' } }),
            );
          }}
        />
      )}

      <ItemEditorModal
        open={world.open}
        type="world"
        mode="create"
        onCancel={() => world.closeCreate()}
        onSave={(draft: any) => {
          const title = (draft.title ?? '').trim();
          if (!title) return;
          const newItem = {
            id: `wi-${Date.now()}`,
            label: title,
            tokens: 100,
            checked: !!draft.checked,
          } as const;

          setSections((prev) => addItem(prev, 'world', newItem));

          world.closeCreate();
          window.dispatchEvent(
            new CustomEvent('toast:show', { detail: { text: 'World info added.' } }),
          );
        }}
      />

      {world.editId && (
        <ItemEditorModal
          open={!!world.editId}
          type="world"
          mode="edit"
          initialValue={() => {
            const item =
              sections.find((s) => s.id === 'world')?.items.find((it) => it.id === world.editId);
            if (!item) return { title: '', summary: '', facts: '', checked: true };
            return {
              title: item.label ?? '',
              summary: '',
              facts: '',
              checked: !!item.checked,
            };
          }}
          onCancel={() => world.endEdit()}
          onSave={(draft: any) => {
            const title = (draft.title ?? '').trim();
            setSections((prev) =>
              editItem(prev, 'world', world.editId as string, (it) => ({
                ...it,
                label: title || it.label,
                checked: !!draft.checked,
              })),
            );

            world.endEdit();
            window.dispatchEvent(
              new CustomEvent('toast:show', { detail: { text: 'World info updated.' } }),
            );
          }}
        />
      )}
    </div>
  );
}
