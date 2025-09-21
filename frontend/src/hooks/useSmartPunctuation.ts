export type TransformResult = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
  didSmart: boolean;
};

export function useSmartPunctuation() {
  function transform(
    value: string,
    selectionStart: number,
    selectionEnd: number,
  ): TransformResult {
    let v = value;
    let s = selectionStart;
    let e = selectionEnd;
    let did = false;

    // Only operate when there's a caret (no range selection)
    if (s === e) {
      // 1) Em-dash: turn "--" immediately before caret into "—"
      if (s >= 2 && v.slice(s - 2, s) === '--') {
        v = v.slice(0, s - 2) + '—' + v.slice(s);
        s = e = s - 1; // caret moves back by one due to replacement
        did = true;
      }

      // 2) Smart double quotes
      if (s >= 1 && v[s - 1] === '"') {
        const before = v.slice(0, s - 1);
        const prevNonSpace = before.match(/[^\s\(\[\{]$/)?.[0];
        const isOpening = !prevNonSpace || /[\s\(\[\{]/.test(before.slice(-1));
        const curly = isOpening ? '“' : '”';
        v = v.slice(0, s - 1) + curly + v.slice(s);
        // caret remains at same visual position
        did = true;
      }

      // 3) Smart single quotes and apostrophes
      if (s >= 1 && v[s - 1] === "'") {
        const before = v.slice(0, s - 1);
        const after = v.slice(s);
        if (/[A-Za-z]$/.test(before) && /^[A-Za-z]/.test(after)) {
          // Apostrophe in contractions: letter'letter -> ’
          v = v.slice(0, s - 1) + '’' + v.slice(s);
          did = true;
        } else {
          const prevNonSpace = before.match(/[^\s\(\[\{]$/)?.[0];
          const isOpening = !prevNonSpace || /[\s\(\[\{]/.test(before.slice(-1));
          const curly = isOpening ? '‘' : '’';
          v = v.slice(0, s - 1) + curly + v.slice(s);
          did = true;
        }
      }
    }

    return { value: v, selectionStart: s, selectionEnd: e, didSmart: did };
  }

  return { transform };
}
