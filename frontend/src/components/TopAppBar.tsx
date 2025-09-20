export default function TopAppBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <h1 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          <span className="font-semibold text-gray-900 dark:text-white">liriac</span>
          <span className="px-2 text-gray-400">—</span>
          <span className="hidden sm:inline">Book:</span>{' '}
          <span className="italic">"El viajero"</span>
          <span className="px-2 text-gray-400">—</span>
          <span className="hidden sm:inline">Chapter 03:</span>{' '}
          <span className="italic">"El puerto"</span>
        </h1>
      </div>
    </header>
  );
}
