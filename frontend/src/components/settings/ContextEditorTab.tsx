import { useCallback, useState } from 'react';
import ContextSectionList, { type ContextSection } from './ContextSectionList';
import ContextTokenBar from './ContextTokenBar';
import ContextGlobalPrompt from './ContextGlobalPrompt';
import ContextStyleTonePanel from './ContextStyleTonePanel';
import ItemEditorModal from './ItemEditorModal';

export default function ContextEditorTab({ tokens }: { tokens: number }) {
  // Local state so toggles persist visually; in a real app this could come from API.
  const [sections, setSections] = useState<ContextSection[]>([
    {
      id: 'chapters',
      title: 'Chapters',
      defaultOpen: false,
      items: [
        { id: 'ch-03', label: '03 — El puerto', tokens: 680, checked: true },
        { id: 'ch-02', label: '02 — Preparativos', tokens: 540, checked: false },
        { id: 'ch-04', label: '04 — Mareas', tokens: 720, checked: false },
      ],
    },
    {
      id: 'characters',
      title: 'Characters',
      defaultOpen: false,
      items: [
        { id: 'char-michelle', label: 'Michelle — Protagonist', tokens: 120, checked: true },
        { id: 'char-arturo', label: 'Arturo — Supporting', tokens: 80, checked: true },
        { id: 'char-port', label: 'Port Authority — Minor', tokens: 40, checked: false },
      ],
    },
    {
      id: 'world',
      title: 'World info',
      defaultOpen: false,
      items: [
        { id: 'wi-port', label: 'The Port of San Aurelio', tokens: 150, checked: true },
        { id: 'wi-ferry', label: 'Ferry schedules', tokens: 60, checked: false },
      ],
    },
  ]);

  const budget = 2000;
  const used = Math.max(0, tokens);

  const [characterModalOpen, setCharacterModalOpen] = useState(false);

  const handleToggle = useCallback((sectionId: string, itemId: string, nextChecked: boolean) => {
    // Update local state so the checkbox reflects the new value
    setSections((prev) =>
      prev.map((s) =>
        s.id !== sectionId
          ? s
          : {
              ...s,
              items: s.items.map((it) =>
                it.id === itemId ? { ...it, checked: nextChecked } : it,
              ),
            },
      ),
    );
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        {sections.map((section) => (
          <ContextSectionList
            key={section.id}
            section={section}
            onToggle={handleToggle}
            addButtonLabel={section.id === 'characters' ? 'Add character' : undefined}
            onAdd={section.id === 'characters' ? () => setCharacterModalOpen(true) : undefined}
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
        open={characterModalOpen}
        type="character"
        onCancel={() => setCharacterModalOpen(false)}
        onSave={(draft) => {
          const label =
            draft.role && draft.role.trim()
              ? `${draft.name.trim()} — ${draft.role.trim()}`
              : draft.name.trim();
          const newItem = {
            id: `char-${Date.now()}`,
            label,
            tokens: 80,
            checked: !!draft.checked,
          } as const;

          setSections((prev) =>
            prev.map((s) =>
              s.id === 'characters'
                ? { ...s, items: [newItem, ...s.items] }
                : s,
            ),
          );

          setCharacterModalOpen(false);
          window.dispatchEvent(
            new CustomEvent('toast:show', { detail: { text: 'Character added.' } }),
          );
        }}
      />
    </div>
  );
}
