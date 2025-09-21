export type CommandLike = {
  id: string;
  label: string;
  hint?: string;
  aliases?: string[];
};

export function normalizeCmd(s: string): string {
  return s.replace(/^\//, '');
}

export function computeSuggestion(commands: CommandLike[], value: string): string | null {
  if (!value.trim().startsWith('/')) return null;
  const q = normalizeCmd(value.trim()).toLowerCase();
  if (!q) return null;
  for (const c of commands) {
    const label = c.label.toLowerCase();
    if (label.startsWith(q)) return c.label;
    for (const a of c.aliases ?? []) {
      const an = normalizeCmd(a).toLowerCase();
      if (an.startsWith(q)) return c.label;
    }
  }
  return null;
}

export function findCommand(commands: CommandLike[], input: string): CommandLike | undefined {
  const q = normalizeCmd(input.trim()).toLowerCase();
  return commands.find(
    (c) =>
      c.label.toLowerCase() === q ||
      (c.aliases ?? []).some((a) => normalizeCmd(a).toLowerCase() === q),
  );
}

export function useFilteredCommands(commands: CommandLike[], query: string): CommandLike[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands.slice(0, 6);
  const parts = q.split(/\s+/g);
  return commands
    .map((c) => {
      const hay = [c.label, ...(c.aliases ?? [])].join(' ').toLowerCase();
      const score = parts.reduce((acc, p) => (hay.includes(p) ? acc + 1 : acc), 0);
      return { c, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ c }) => c)
    .slice(0, 8);
}
