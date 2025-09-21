import type { ContextSection } from '../components/settings/ContextSectionList';

export const INITIAL_SECTIONS: ContextSection[] = [
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
      {
        id: 'char-michelle',
        label: 'Michelle — Protagonist',
        tokens: 120,
        checked: true,
      },
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
];
