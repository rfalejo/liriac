import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Book } from '../../../api/endpoints';
import { createBook, updateBook } from '../../../api/endpoints';
import { isOk } from '../../../api/client';

export type BookDialogMode = 'create' | 'edit';

interface BookDialogProps {
  mode: BookDialogMode;
  initial?: Pick<Book, 'id' | 'title' | 'slug'> | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (book: Book) => void;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function BookDialog({ mode, initial, isOpen, onClose, onSuccess }: BookDialogProps) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [touchedSlug, setTouchedSlug] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initial?.title ?? '');
      setSlug(initial?.slug ?? '');
      setTouchedSlug(false);
      setFieldErrors({});
      setGeneralError(null);
      // Focus first field
      setTimeout(() => {
        dialogRef.current?.querySelector<HTMLInputElement>('#book-title')?.focus();
      }, 0);
    }
  }, [isOpen, initial]);

  // Auto-generate slug from title unless user has manually edited slug
  useEffect(() => {
    if (!touchedSlug) {
      setSlug(slugify(title));
    }
  }, [title, touchedSlug]);

  const slugPattern = useMemo(() => /^[a-z0-9-]+$/, []);
  const titleValid = title.trim().length > 0;
  const slugValid = slug.trim().length > 0 && slugPattern.test(slug);
  const canSubmit = titleValid && slugValid && !submitting;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setFieldErrors({});
    setGeneralError(null);

    const payload = { title: title.trim(), slug: slug.trim() };
    const result = mode === 'create'
      ? await createBook(payload)
      : await updateBook(initial!.id, payload);

    setSubmitting(false);

    if (isOk(result)) {
      onSuccess?.(result.data);
      onClose();
    } else {
      // Try to parse field errors from DRF style response
      try {
        const res = result.response;
        const data = await res?.clone().json();
        if (data && typeof data === 'object') {
          const rec = data as Record<string, unknown>;
          const fe: Record<string, string[]> = {};
          for (const [k, v] of Object.entries(rec)) {
            if (Array.isArray(v)) {
              fe[k] = v.map(String);
            }
          }
          setFieldErrors(fe);
          if (Object.keys(fe).length === 0) setGeneralError(result.error);
        } else {
          setGeneralError(result.error);
        }
      } catch {
        setGeneralError(result.error);
      }
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg dark:bg-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800"
      >
        <h3 id={titleId} className="text-lg font-semibold">
          {mode === 'create' ? 'New Book' : 'Edit Book'}
        </h3>
        <p id={descId} className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          {mode === 'create' ? 'Create a new book by providing a title and slug.' : 'Update the title or slug for this book.'}
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <label htmlFor="book-title" className="block text-sm font-medium">Title</label>
            <input
              id="book-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
            />
            {fieldErrors.title && (
              <p className="mt-1 text-sm text-red-600" aria-live="polite">{fieldErrors.title.join(' ')}</p>
            )}
          </div>
          <div>
            <label htmlFor="book-slug" className="block text-sm font-medium">Slug</label>
            <input
              id="book-slug"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setTouchedSlug(true);
              }}
              pattern="[a-z0-9-]+"
              required
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
            />
            <p className="mt-1 text-xs text-zinc-500">Lowercase letters, numbers, and dashes only.</p>
            {fieldErrors.slug && (
              <p className="mt-1 text-sm text-red-600" aria-live="polite">{fieldErrors.slug.join(' ')}</p>
            )}
          </div>

          {generalError && (
            <div className="p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded" aria-live="polite">
              {generalError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-zinc-300 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
