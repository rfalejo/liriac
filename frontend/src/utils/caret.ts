export function getCaretTop(el: HTMLTextAreaElement): number {
  const style = window.getComputedStyle(el);
  const div = document.createElement('div');
  const span = document.createElement('span');

  div.style.position = 'absolute';
  div.style.whiteSpace = 'pre-wrap';
  div.style.wordWrap = 'break-word';
  div.style.visibility = 'hidden';
  div.style.zIndex = '-9999';
  // Mirror key text metrics
  div.style.font = style.font;
  div.style.lineHeight = style.lineHeight;
  div.style.padding = style.padding;
  div.style.border = style.border;
  div.style.boxSizing = style.boxSizing;
  div.style.width = el.clientWidth + 'px';

  const selStart = el.selectionStart ?? 0;
  const before = el.value.slice(0, selStart);
  const after = el.value.slice(selStart) || '.';

  div.textContent = before;
  span.textContent = after;
  div.appendChild(span);
  document.body.appendChild(div);
  const top = span.offsetTop;
  document.body.removeChild(div);
  return top;
}

// Keep caret ~40% from top; limit per-tick scroll to avoid jumps
export function typewriterScroll(el: HTMLTextAreaElement) {
  try {
    const caretTop = getCaretTop(el);
    const desired = Math.max(0, caretTop - el.clientHeight * 0.4);
    const delta = desired - el.scrollTop;
    if (Math.abs(delta) > 4) {
      const step = Math.sign(delta) * Math.min(Math.abs(delta), 120);
      el.scrollTop += step;
    }
  } catch {
    // no-op on failure
  }
}
