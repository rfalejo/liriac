export function getSceneOffsets(text: string): number[] {
  // Scenes are separated by blank-line + *** + blank-line
  const breaks: number[] = [0];
  const re = /\n\*\*\*\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    breaks.push(m.index + m[0].length);
  }
  return breaks;
}

export function jumpToOffset(el: HTMLTextAreaElement, offset: number) {
  const pos = Math.max(0, Math.min(offset, el.value.length));
  el.selectionStart = el.selectionEnd = pos;
  el.focus();
}

export function gotoScene(el: HTMLTextAreaElement, n: number) {
  const offs = getSceneOffsets(el.value);
  const idx = Math.max(0, Math.min(n - 1, offs.length - 1));
  jumpToOffset(el, offs[idx]);
}

export function gotoTop(el: HTMLTextAreaElement) {
  jumpToOffset(el, 0);
}
