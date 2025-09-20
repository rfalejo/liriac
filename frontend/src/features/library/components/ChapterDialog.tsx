import { createPortal } from 'react-dom';
import { useEffect, useId, useRef, useState } from 'react';
import type { ChapterDetail, ChapterList } from '../../../api/endpoints';
import { createChapter, updateChapter } from '../../../api/endpoints';
import { isOk } from '../../../api/client';
import { sha256Hex } from '../../../utils/hash';

export type ChapterDialogMode = 'create' | 'edit';

interface ChapterDialogProps {
  mode: ChapterDialogMode;
  // For create: we need the parent book id
  bookId?: number;
  // For edit: we need the chapter id and initial values
  initial?: Pick<ChapterList, 'id' | 'title' | 'order'> | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (_chapter: { id: number; title: string; order: number }) => void;
  // Optional: navigate to editor after create
  navigateOnCreate?: boolean;
}

export default function ChapterDialog({
  mode,
  bookId,
  initial,
  isOpen,
  onClose,
  onSuccess,
}: ChapterDialogProps) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(initial?.title ?? '');
    // order is not editable in dialog anymore
    setFieldErrors({});
    setGeneralError(null);
    setTimeout(() => {
      dialogRef.current?.querySelector<HTMLInputElement>('#chapter-title')?.focus();
    }, 0);
  }, [isOpen, initial]);

  const titleValid = title.trim().length > 0;
  const canSubmit =
    titleValid && !submitting && (mode === 'edit' || bookId !== undefined);

  const parseFieldErrors = async (error: {
    response?: Response | null;
    error: string;
  }) => {
    try {
      const res = error.response;
      const data = await res?.clone().json();
      if (data && typeof data === 'object') {
        const rec = data as Record<string, unknown>;
        const fe: Record<string, string[]> = {};
        for (const [k, v] of Object.entries(rec)) {
          if (Array.isArray(v)) fe[k] = v.map(String);
        }
        setFieldErrors(fe);
        if (Object.keys(fe).length === 0) setGeneralError(error.error);
      } else {
        setGeneralError(error.error);
      }
    } catch {
      setGeneralError(error.error);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setFieldErrors({});
    setGeneralError(null);

    if (mode === 'create') {
      // New chapters start empty and are appended to the end by the server.
      const checksum = await sha256Hex('');
      const result = await createChapter(bookId!, {
        title: title.trim(),
        checksum,
      });
      setSubmitting(false);
      if (isOk(result)) {
        const ch = result.data as unknown as ChapterList; // API returns ChapterList shape
        onSuccess?.({ id: ch.id, title: ch.title, order: ch.order });
        onClose();
      } else {
        await parseFieldErrors(result);
      }
    } else {
      const result = await updateChapter(initial!.id, {
        title: title.trim(),
      });
      setSubmitting(false);
      if (isOk(result)) {
        const ch = result.data as unknown as ChapterDetail;
        onSuccess?.({ id: ch.id, title: ch.title, order: ch.order });
        onClose();
      } else {
        await parseFieldErrors(result);
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
          {mode === 'create' ? 'New Chapter' : 'Edit Chapter'}
        </h3>
        <p id={descId} className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          {mode === 'create'
            ? 'Create a new chapter under the selected book.'
            : 'Update the title of this chapter.'}
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <label htmlFor="chapter-title" className="block text-sm font-medium">
              Title
            </label>
            <input
              id="chapter-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
            />
            {fieldErrors.title && (
              <p className="mt-1 text-sm text-red-600" aria-live="polite">
                {fieldErrors.title.join(' ')}
              </p>
            )}
          </div>

          {/* Order and Body fields removed (BL-012D). New chapters start empty; ordering via DnD. */}

          {generalError && (
            <div
              className="p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded"
              aria-live="polite"
            >
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
