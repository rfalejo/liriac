/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { CommandItem, Connectivity, DocMeta, TopBarAPI, TopContribution } from './types';

type Ctx = TopContribution & {
  api: TopBarAPI;
  paletteOpen: boolean;
  commands: CommandItem[];
};

const TopBarContext = createContext<Ctx | null>(null);

const DEFAULT_STATE: TopContribution = {
  breadcrumb: '',
  quickActions: [],
  chips: [],
  meta: {},
  connectivity: { api: 'online', ws: 'connected', env: 'DEV' },
  promptEnabled: true,
};

type ViteEnv = { DEV?: boolean };
const isDevLike = () => typeof import.meta !== 'undefined' && (import.meta.env as ViteEnv | undefined)?.DEV !== false;

export function TopBarProvider({ children }: { children: React.ReactNode }) {
  const stateRef = useRef<TopContribution>({ ...DEFAULT_STATE });
  const [version, setVersion] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const commandsRef = useRef<CommandItem[]>([]);

  const set = useCallback((contrib: TopContribution) => {
    stateRef.current = { ...DEFAULT_STATE, ...contrib };
    setVersion((v) => v + 1);
  }, []);

  const patch = useCallback((contrib: Partial<TopContribution>) => {
    stateRef.current = { ...stateRef.current, ...contrib };
    setVersion((v) => v + 1);
  }, []);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  const registerCommands = useCallback((items: CommandItem[]) => {
    const existing = new Map(commandsRef.current.map((c) => [c.id, c] as const));
    for (const item of items) existing.set(item.id, item);
    commandsRef.current = Array.from(existing.values());
    setVersion((v) => v + 1);
  }, []);

  const setMockConnectivity = useCallback((conn: Partial<Connectivity>) => {
    if (!isDevLike()) return; // no-op in prod
    stateRef.current = {
      ...stateRef.current,
      connectivity: { ...(stateRef.current.connectivity || DEFAULT_STATE.connectivity!), ...conn },
    };
    setVersion((v) => v + 1);
  }, []);

  const setMockDocMeta = useCallback((meta: DocMeta) => {
    if (!isDevLike()) return; // no-op in prod
    stateRef.current = { ...stateRef.current, meta: { ...(stateRef.current.meta || {}), ...meta } };
    setVersion((v) => v + 1);
  }, []);

  const api: TopBarAPI = useMemo(
    () => ({ set, patch, openPalette, closePalette, registerCommands, setMockConnectivity, setMockDocMeta }),
    [set, patch, openPalette, closePalette, registerCommands, setMockConnectivity, setMockDocMeta],
  );

  // Hotkeys: '/' focuses search (open palette), Cmd/Ctrl+K toggles palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea/contenteditable
      const target = e.target as HTMLElement | null;
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isTyping) return;

      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const value = useMemo(
    () => ({ ...stateRef.current, api, paletteOpen, commands: commandsRef.current, _v: version }) as unknown as Ctx,
    [api, paletteOpen, version],
  );

  return <TopBarContext.Provider value={value}>{children}</TopBarContext.Provider>;
}

export function useTopBar() {
  const ctx = useContext(TopBarContext);
  if (!ctx) throw new Error('useTopBar must be used within TopBarProvider');
  return ctx.api;
}

export function useTopBarState() {
  const ctx = useContext(TopBarContext);
  if (!ctx) throw new Error('useTopBarState must be used within TopBarProvider');
  return ctx;
}
