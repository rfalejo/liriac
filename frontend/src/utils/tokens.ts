export function mockTokenize(text: string): number {
  const len = (text || '').trim().length;
  return len === 0 ? 0 : Math.ceil(len / 4);
}
