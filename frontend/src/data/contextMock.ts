import type { ContextSection } from '../components/settings/ContextSectionList';

export const INITIAL_SECTIONS: ContextSection[] = [
  {
    id: 'chapters',
    title: 'Chapters',
    defaultOpen: false,
    items: [
      {
        id: 'ch-03',
        type: 'chapter',
        title: '03 — El puerto',
        tokens: 680,
        checked: true,
      },
      {
        id: 'ch-02',
        type: 'chapter',
        title: '02 — Preparativos',
        tokens: 540,
        checked: false,
      },
      {
        id: 'ch-04',
        type: 'chapter',
        title: '04 — Mareas',
        tokens: 720,
        checked: false,
      },
    ],
  },
  {
    id: 'characters',
    title: 'Characters',
    defaultOpen: false,
    items: [
      {
        id: 'char-michelle',
        type: 'character',
        name: 'Michelle',
        role: 'Protagonist',
        tokens: 120,
        checked: true,
      },
      {
        id: 'char-arturo',
        type: 'character',
        name: 'Arturo',
        role: 'Supporting',
        tokens: 80,
        checked: true,
      },
      {
        id: 'char-port',
        type: 'character',
        name: 'Port Authority',
        role: 'Minor',
        tokens: 40,
        checked: false,
      },
    ],
  },
  {
    id: 'world',
    title: 'World info',
    defaultOpen: false,
    items: [
      {
        id: 'wi-port',
        type: 'world',
        title: 'The Port of San Aurelio',
        tokens: 150,
        checked: true,
      },
      {
        id: 'wi-ferry',
        type: 'world',
        title: 'Ferry schedules',
        tokens: 60,
        checked: false,
      },
    ],
  },
  {
    id: 'styleTone',
    title: 'Writing style & tone',
    defaultOpen: false,
    items: [
      {
        id: 'st-house',
        type: 'styleTone',
        description: 'House style: concise, sensory details',
        tokens: 40,
        checked: true,
      },
      {
        id: 'st-tone-moody',
        type: 'styleTone',
        description: 'Tone: moody, atmospheric',
        tokens: 30,
        checked: false,
      },
    ],
  },
];
