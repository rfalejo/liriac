import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            <Link to="/" aria-label="Liriac home" className="hover:text-indigo-600 transition-colors">
              liriac
            </Link>
          </h1>
          <nav aria-label="Main navigation" className="text-sm text-gray-600 space-x-4">
            <span className="opacity-60">{/* Future nav items */}</span>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl w-full mx-auto px-4 py-8 flex-1">{children}</main>
      <footer className="border-t bg-white/70 backdrop-blur py-2 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <span>Status: placeholder</span>
            <span>© {new Date().getFullYear()} liriac</span>
        </div>
      </footer>
    </div>
  );
}

export default AppLayout;
