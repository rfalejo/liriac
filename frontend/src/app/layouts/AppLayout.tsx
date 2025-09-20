import type { PropsWithChildren } from 'react';
import { BottomBarProvider } from '../../features/bottombar';
import { BottomBar, PromptPopover } from '../../features/bottombar';
import { TopBarProvider } from '../../features/topbar';
import { TopBar, CommandPalette } from '../../features/topbar';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <TopBarProvider>
      <BottomBarProvider>
        <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col">
          <TopBar />
          <main className="max-w-7xl w-full mx-auto px-4 py-8 pb-20 flex-1 flex flex-col gap-6">
            {children}
          </main>
          {/* Anchored UI at bottom */}
          <PromptPopover />
          <BottomBar />
          {/* Overlays */}
          <CommandPalette />
        </div>
      </BottomBarProvider>
    </TopBarProvider>
  );
}

export default AppLayout;
