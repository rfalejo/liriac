export type Command = {
  id: string;
  label: string;
  hint?: string;
  aliases?: string[];
};

export const COMMANDS: Command[] = [
  { id: 'undo', label: 'undo', hint: 'Revert last action', aliases: ['/undo'] },
  { id: 'redo', label: 'redo', hint: 'Re-apply last reverted action' },
  {
    id: 'spell',
    label: 'spell-check',
    hint: 'Check spelling in selection',
    aliases: ['spell', '/spell-check'],
  },
  { id: 'outline', label: 'outline generate', hint: 'Generate chapter outline' },
  {
    id: 'rewrite-tone',
    label: 'rewrite paragraph tone: moody',
    hint: 'Rewrite selection with tone',
  },
  { id: 'insert-break', label: 'insert scene break', hint: 'Add a scene separator' },
  { id: 'count', label: 'count words', hint: 'Show word count' },
  { id: 'timer-start', label: 'timer start 25m', hint: 'Start a 25m session' },
  {
    id: 'goto',
    label: 'goto',
    hint: 'Jump: /goto top | last-edit | scene N',
    aliases: ['/goto'],
  },
  {
    id: 'context',
    label: 'context',
    hint: 'Open context editor',
    aliases: ['/context'],
  },
];

export type CmdContext = {
  textareaEl: HTMLTextAreaElement | null;
  gotoTop(): void;
  gotoLastEdit(): void;
  gotoScene(_n: number): void;
  closePalette(): void;
  toast(_text: string): void;
  emit(_id: string, _input: string): void;
};

export function executeCommand(cmd: Command, rawInput: string, ctx: CmdContext) {
  const { textareaEl, gotoTop, gotoLastEdit, gotoScene, closePalette, toast, emit } =
    ctx;

  switch (cmd.id) {
    case 'context': {
      window.dispatchEvent(new CustomEvent('context:open'));
      closePalette();
      return;
    }
    case 'goto': {
      const raw = rawInput.trim();
      const norm = raw.startsWith('/') ? raw.slice(1) : raw;
      const parts = norm.split(/\s+/).filter(Boolean); // e.g., ['goto','scene','3']
      const args = parts.slice(1);

      if (args.length === 0) {
        // no-op
      } else {
        const head = args[0].toLowerCase();
        if (head === 'top') {
          gotoTop();
        } else if (head === 'last-edit' || head === 'last' || head === 'lastedit') {
          gotoLastEdit();
        } else if (head === 'scene' && args[1]) {
          const n = parseInt(args[1], 10);
          if (!Number.isNaN(n) && n > 0) gotoScene(n);
        } else {
          const n = parseInt(head, 10);
          if (!Number.isNaN(n) && n > 0) gotoScene(n);
        }
      }
      closePalette();
      return;
    }
    case 'insert-break': {
      const el = textareaEl;
      if (el) {
        const v = el.value;
        const start = el.selectionStart ?? v.length;
        const end = el.selectionEnd ?? start;
        const insert = '\n\n***\n\n';
        const next = v.slice(0, start) + insert + v.slice(end);
        el.value = next;
        // Move caret after insertion
        const caret = start + insert.length;
        el.selectionStart = el.selectionEnd = caret;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
      break;
    }
    // For now, other commands just emit the event for toast feedback
    default: {
      // no-op
    }
  }

  emit(cmd.id, rawInput);
  closePalette();
  toast(''); // no explicit toast here; Toasts will handle editor:command
}
