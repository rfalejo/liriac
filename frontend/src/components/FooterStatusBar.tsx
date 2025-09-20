export default function FooterStatusBar() {
  return (
    <footer className="sticky bottom-0 border-t border-gray-200 bg-white/90 py-2 text-sm text-gray-700 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90 dark:text-gray-300">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 sm:px-6">
        <span>
          <span className="font-medium text-gray-900 dark:text-white">Mode:</span> Manual
        </span>
        <span className="hidden sm:inline text-gray-400">•</span>
        <span>Book: El viajero</span>
        <span className="hidden sm:inline text-gray-400">•</span>
        <span>Chapter: 03</span>
        <span className="hidden sm:inline text-gray-400">•</span>
        <span>Ln 12, Col 1</span>
        <span className="hidden sm:inline text-gray-400">•</span>
        <span>Autosave: active (every 10s)</span>
      </div>
    </footer>
  );
}
