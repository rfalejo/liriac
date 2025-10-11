import { useAppStore } from '../store/appStore';

export default function TopAppBar() {
  const currentChapter = useAppStore((s) => s.editor.currentChapter);
  const bookTitle = currentChapter?.bookTitle?.trim() || 'Unknown book';
  const chapterTitle = currentChapter?.chapterTitle?.trim() || 'Untitled chapter';
  const chapterNumberMatch = chapterTitle.match(/^(\d+)/);
  const chapterNumber = chapterNumberMatch ? chapterNumberMatch[1] : null;

  return (
    <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)] backdrop-blur transition-opacity duration-200">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <h1 className="text-sm font-medium text-[var(--muted)] flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-semibold text-[var(--fg)]">liriac</span>
          <span className="text-[var(--muted)]">—</span>
          <span className="hidden sm:inline">Book:</span>
          <span className="italic text-[var(--fg)]">“{bookTitle}”</span>
          <span className="text-[var(--muted)]">—</span>
          {chapterNumber ? (
            <span className="hidden sm:inline">Chapter {chapterNumber}:</span>
          ) : (
            <span className="hidden sm:inline">Chapter:</span>
          )}
          <span className="italic text-[var(--fg)]">“{chapterTitle}”</span>
        </h1>
      </div>
    </header>
  );
}
