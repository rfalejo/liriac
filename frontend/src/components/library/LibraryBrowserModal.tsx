import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { components } from '../../api/schema';

const overlayClasses =
  'fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm';

const cardClasses =
  'relative pointer-events-auto w-full max-w-5xl mx-auto rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-xl';

const sectionTitleClasses = 'text-xs font-semibold uppercase tracking-wide text-[var(--muted)]';

const buttonBase =
  'rounded border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium transition-colors duration-150';

const listButtonBase =
  'w-full text-left rounded-md px-3 py-2 text-sm transition-colors duration-150 hover:bg-black/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]';

type LibraryBook = components['schemas']['LibraryBook'];
type ChapterSummary = components['schemas']['ChapterSummary'];

export type LibraryBrowserModalProps = {
  open: boolean;
  books: LibraryBook[];
  activeChapterId?: string | null;
  loadingChapterId?: string | null;
  onClose: () => void;
  onSelectChapter: (_book: LibraryBook, _chapter: ChapterSummary) => void;
};

export default function LibraryBrowserModal({
  open,
  books,
  activeChapterId = null,
  loadingChapterId = null,
  onClose,
  onSelectChapter,
}: LibraryBrowserModalProps) {
  const [query, setQuery] = useState('');
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bookButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const chapterButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [focusedChapterId, setFocusedChapterId] = useState<string | null>(null);

  const setBookButtonRef = useCallback(
    (index: number) => (node: HTMLButtonElement | null) => {
      bookButtonRefs.current[index] = node;
    },
    [],
  );

  const setChapterButtonRef = useCallback(
    (index: number) => (node: HTMLButtonElement | null) => {
      chapterButtonRefs.current[index] = node;
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const first = books[0]?.id ?? null;
    setActiveBookId(first);
    const raf = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open, books]);

  const normalizedQuery = query.trim().toLowerCase();
  const activeBook = books.find((book) => book.id === activeBookId) ?? books[0];

  const chapters = useMemo(() => {
    const list: Array<{ book: LibraryBook; chapter: ChapterSummary }> = [];
    for (const book of books) {
      for (const chapter of book.chapters ?? []) {
        if (!normalizedQuery) {
          if (!activeBook || book.id === activeBook.id) {
            list.push({ book, chapter });
          }
          continue;
        }
        const haystack = `${chapter.title} ${chapter.summary ?? ''}`.toLowerCase();
        if (haystack.includes(normalizedQuery)) {
          list.push({ book, chapter });
        }
      }
    }
    return list;
  }, [books, activeBook, normalizedQuery]);

  useEffect(() => {
    bookButtonRefs.current = bookButtonRefs.current.slice(0, books.length);
  }, [books.length]);

  useEffect(() => {
    chapterButtonRefs.current = chapterButtonRefs.current.slice(0, chapters.length);
  }, [chapters.length]);

  useEffect(() => {
    if (!open) return;
    if (chapters.length === 0) {
      setFocusedChapterId(null);
      return;
    }

    setFocusedChapterId((previous) => {
      if (previous && chapters.some((entry) => entry.chapter.id === previous)) {
        return previous;
      }

      if (activeChapterId) {
        const activeMatch = chapters.find((entry) => entry.chapter.id === activeChapterId);
        if (activeMatch) return activeMatch.chapter.id;
      }

      return chapters[0]?.chapter.id ?? null;
    });
  }, [open, chapters, activeChapterId]);

  const focusChapterAt = useCallback(
    (index: number, direction: 1 | -1 = 1) => {
      if (!chapters.length) return null;

      const total = chapters.length;
      let candidate = index;
      let attempts = 0;

      while (attempts < total) {
        const normalized = ((candidate % total) + total) % total;
        const ref = chapterButtonRefs.current[normalized];
        const entry = chapters[normalized];

        if (ref && !ref.disabled) {
          setFocusedChapterId(entry.chapter.id);
          requestAnimationFrame(() => ref.focus());
          return normalized;
        }

        candidate += direction;
        attempts += 1;
      }

      return null;
    },
    [chapters],
  );

  const handleSelect = useCallback(
    (book: LibraryBook, chapter: ChapterSummary) => {
      onSelectChapter(book, chapter);
    },
    [onSelectChapter],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const { key } = event;
      const activeElement = document.activeElement as HTMLElement | null;

      if (key === 'ArrowDown' || key === 'ArrowUp') {
        const delta = key === 'ArrowDown' ? 1 : -1;

        if (activeElement === searchRef.current) {
          if (chapters.length === 0) return;
          event.preventDefault();
          focusChapterAt(key === 'ArrowDown' ? 0 : chapters.length - 1, delta > 0 ? 1 : -1);
          return;
        }

        const bookIndex = bookButtonRefs.current.findIndex((node) => node === activeElement);
        if (bookIndex >= 0) {
          if (books.length === 0) return;
          event.preventDefault();
          const nextIndex = (bookIndex + delta + books.length) % books.length;
          const nextBook = books[nextIndex];
          bookButtonRefs.current[nextIndex]?.focus();
          setActiveBookId(nextBook?.id ?? null);
          return;
        }

        const chapterIndex = chapterButtonRefs.current.findIndex((node) => node === activeElement);
        if (chapterIndex >= 0) {
          event.preventDefault();
          focusChapterAt(chapterIndex + delta, delta > 0 ? 1 : -1);
          return;
        }
      }

      if (key === 'ArrowRight') {
        const bookIndex = bookButtonRefs.current.findIndex((node) => node === activeElement);
        if (bookIndex >= 0) {
          if (chapters.length === 0) return;
          event.preventDefault();
          const targetBook = books[bookIndex];
          const chapterIndex = chapters.findIndex((entry) => entry.book.id === targetBook?.id);
          if (chapterIndex >= 0) {
            focusChapterAt(chapterIndex, 1);
          } else {
            focusChapterAt(0, 1);
          }
          return;
        }
      }

      if (key === 'ArrowLeft') {
        const chapterIndex = chapterButtonRefs.current.findIndex((node) => node === activeElement);
        if (chapterIndex >= 0) {
          event.preventDefault();
          const targetEntry = chapters[chapterIndex];
          const targetBookId = targetEntry?.book.id ?? activeBook?.id ?? activeBookId;
          const targetBookIndex = targetBookId
            ? books.findIndex((book) => book.id === targetBookId)
            : -1;
          const normalizedIndex = targetBookIndex >= 0 ? targetBookIndex : 0;
          bookButtonRefs.current[normalizedIndex]?.focus();
          setActiveBookId(books[normalizedIndex]?.id ?? null);
          return;
        }
      }

      if (key === 'Enter') {
        const chapterIndex = chapterButtonRefs.current.findIndex((node) => node === activeElement);
        if (chapterIndex >= 0) {
          event.preventDefault();
          const entry = chapters[chapterIndex];
          if (entry) handleSelect(entry.book, entry.chapter);
        }
      }

      if (key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    },
    [
      activeBook?.id,
      activeChapterId,
      activeBookId,
      books,
      chapters,
      focusChapterAt,
      onClose,
      handleSelect,
    ],
  );

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="library-browser-title"
      className={overlayClasses}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="absolute inset-0" aria-hidden="true" />
      <div className={cardClasses}>
        <div className="flex flex-col gap-4 border-b border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p id="library-browser-title" className="text-sm font-medium text-[var(--fg)]">
              Library explorer
            </p>
            <p className="text-xs text-[var(--muted)]">
              Browse chapters across every book. Use Ctrl+Shift+L to open quickly.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`${buttonBase} bg-black/10 text-[var(--muted)] hover:bg-black/20`}
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-[220px_1fr]">
          <aside className="space-y-3">
            <div className="space-y-2">
              <p className={sectionTitleClasses}>Books</p>
              <ul className="space-y-1">
                {books.map((book, index) => {
                  const isActive = book.id === activeBook?.id;
                  return (
                    <li key={book.id}>
                      <button
                        type="button"
                        ref={setBookButtonRef(index)}
                        className={`${listButtonBase} ${
                          isActive ? 'bg-black/20 text-[var(--fg)]' : 'text-[var(--muted)]'
                        }`}
                        aria-current={isActive ? 'true' : undefined}
                        onClick={() => setActiveBookId(book.id)}
                        onFocus={() => setActiveBookId(book.id)}
                      >
                        <span className="block text-sm font-medium text-[var(--fg)]">
                          {book.title}
                        </span>
                        {book.author ? (
                          <span className="text-xs text-[var(--muted)]">{book.author}</span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            {activeBook?.synopsis ? (
              <div className="rounded-md border border-[var(--border)] bg-black/10 p-3 text-xs text-[var(--muted)]">
                {activeBook.synopsis}
              </div>
            ) : null}
          </aside>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <label className="flex-1">
                <span className="sr-only">Search chapters</span>
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search chapters…"
                  className="w-full rounded-md border border-[var(--border)] bg-black/15 px-3 py-2 text-sm text-[var(--fg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  type="search"
                />
              </label>
              <span className="hidden text-xs text-[var(--muted)] sm:inline">Press Esc to close</span>
            </div>

            <div className="max-h-[24rem] overflow-y-auto pr-1">
              {chapters.length === 0 ? (
                <p className="rounded-md border border-dashed border-[var(--border)] bg-black/10 px-4 py-6 text-center text-sm text-[var(--muted)]">
                  {normalizedQuery
                    ? 'No chapters match that search.'
                    : 'No chapters available for this book yet.'}
                </p>
              ) : (
                <ul className="space-y-2">
                  {chapters.map(({ book, chapter }, index) => {
                    const isActive = chapter.id === activeChapterId;
                    const isLoading = chapter.id === loadingChapterId;
                    const isFocused = focusedChapterId === chapter.id;
                    const ringClass =
                      isActive || isFocused
                        ? 'ring-2 ring-offset-2 ring-[var(--accent)] ring-offset-[var(--surface)]'
                        : '';
                    const actionLabel = isLoading
                      ? 'Opening…'
                      : isActive
                        ? 'Reopen'
                        : 'Open chapter';
                    return (
                      <li key={`${book.id}-${chapter.id}`}>
                        <button
                          type="button"
                          ref={setChapterButtonRef(index)}
                          data-chapter-id={chapter.id}
                          className={`w-full text-left rounded-md border border-[var(--border)] bg-black/20 p-3 transition-colors duration-150 focus-visible:outline-none hover:bg-black/30 disabled:cursor-wait disabled:text-[var(--muted)] disabled:bg-black/30 ${ringClass}`}
                          aria-current={isActive ? 'true' : undefined}
                          aria-label={`Open chapter — ${chapter.title}`}
                          title={`${chapter.title} — ${book.title}`}
                          disabled={isLoading}
                          onClick={() => handleSelect(book, chapter)}
                          onFocus={() => setFocusedChapterId(chapter.id)}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-[var(--fg)]">
                                {chapter.title}
                              </p>
                              <p className="text-xs text-[var(--muted)]">{book.title}</p>
                            </div>
                            <span
                              className={`${buttonBase} ${
                                isLoading
                                  ? 'cursor-wait bg-black/30 text-[var(--muted)]'
                                  : 'bg-black/20 text-[var(--fg)]'
                              }`}
                              aria-hidden="true"
                            >
                              {actionLabel}
                            </span>
                          </div>
                          {chapter.summary ? (
                            <p className="mt-2 text-xs text-[var(--muted)]">{chapter.summary}</p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-3 text-[0.65rem] uppercase tracking-wide text-[var(--muted)]">
                            <span>Chapter {chapter.ordinal}</span>
                            {typeof chapter.tokens === 'number' ? (
                              <span>~{chapter.tokens} tokens</span>
                            ) : null}
                            {typeof chapter.wordCount === 'number' ? (
                              <span>{chapter.wordCount} words</span>
                            ) : null}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3 text-xs text-[var(--muted)]">
          <span>Use ↑ ↓ to move, Enter to open. Chapters filter as you type.</span>
          <span>Ctrl+Shift+L will always reopen this view.</span>
        </div>
      </div>
    </div>
  );
}
