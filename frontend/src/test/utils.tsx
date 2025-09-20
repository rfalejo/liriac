/* eslint-disable react-refresh/only-export-components */
import { render, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { BottomBarProvider } from '../features/bottombar';
import { BottomBar, PromptPopover } from '../features/bottombar';
import { TopBarProvider } from '../features/topbar';
import { CommandPalette } from '../features/topbar';

// Test wrapper with necessary providers
interface TestProvidersProps {
  children: ReactNode;
  initialEntries?: string[];
}

export function TestProviders({
  children,
  initialEntries = ['/'],
}: TestProvidersProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <TopBarProvider>
          <BottomBarProvider>
            {children}
            {/* Anchor global UI similar to AppLayout */}
            <PromptPopover />
            <BottomBar />
            <CommandPalette />
          </BottomBarProvider>
        </TopBarProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// Custom render that includes providers
export function renderWithProviders(
  ui: ReactNode,
  options: { initialEntries?: string[] } = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders initialEntries={options.initialEntries}>{children}</TestProviders>
    ),
  });
}

// Custom renderHook that includes providers
export function renderHookWithProviders<T>(
  hook: () => T,
  options: { initialEntries?: string[] } = {},
) {
  return renderHook(hook, {
    wrapper: ({ children }) => (
      <TestProviders initialEntries={options.initialEntries}>{children}</TestProviders>
    ),
  });
}

// Mock data factories
export const mockBook = {
  id: 1,
  title: 'Test Book',
  slug: 'test-book',
  created_at: '2025-01-01T00:00:00Z',
  last_opened: '2025-01-02T00:00:00Z',
};

export const mockChapter = {
  id: 1,
  title: 'Test Chapter',
  order: 1,
  updated_at: '2025-01-01T00:00:00Z',
};

export const mockPaginatedBooks = {
  count: 1,
  next: null,
  previous: null,
  results: [mockBook],
};

export const mockPaginatedChapters = {
  count: 1,
  next: null,
  previous: null,
  results: [mockChapter],
};

// Mock the API client for tests
export const mockApiResult = {
  ok: true as const,
  data: mockPaginatedBooks,
  status: 200,
  response: new Response(),
};

export const mockApiError = {
  ok: false as const,
  error: 'Test error',
  status: 500,
  response: new Response(),
};
