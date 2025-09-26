import { useState } from 'react';

export function useContextModals() {
  const [characterModalOpen, setCharacterModalOpen] = useState(false);
  const [characterEditId, setCharacterEditId] = useState<string | null>(null);

  const [worldModalOpen, setWorldModalOpen] = useState(false);
  const [worldEditId, setWorldEditId] = useState<string | null>(null);

  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [styleEditId, setStyleEditId] = useState<string | null>(null);

  return {
    character: {
      open: characterModalOpen,
      openCreate: () => setCharacterModalOpen(true),
      closeCreate: () => setCharacterModalOpen(false),
      editId: characterEditId,
      startEdit: (id: string) => setCharacterEditId(id),
      endEdit: () => setCharacterEditId(null),
    },
    world: {
      open: worldModalOpen,
      openCreate: () => setWorldModalOpen(true),
      closeCreate: () => setWorldModalOpen(false),
      editId: worldEditId,
      startEdit: (id: string) => setWorldEditId(id),
      endEdit: () => setWorldEditId(null),
    },
    style: {
      open: styleModalOpen,
      openCreate: () => setStyleModalOpen(true),
      closeCreate: () => setStyleModalOpen(false),
      editId: styleEditId,
      startEdit: (id: string) => setStyleEditId(id),
      endEdit: () => setStyleEditId(null),
    },
  };
}
