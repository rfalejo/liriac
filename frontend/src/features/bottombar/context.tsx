/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import type { BottomBarAPI, BottomContribution, EphemeralMessage } from './types';

type Ctx = BottomContribution & {
  api: BottomBarAPI;
  ephemeral?: EphemeralMessage | null;
};

const BottomBarContext = createContext<Ctx | null>(null);

const DEFAULT_STATE: BottomContribution = {
  left: '',
  middle: '',
  rightShortcuts: [],
  editor: {
    modeLabel: 'Mode: Manual',
    autosaveLabel: 'Autosave: active (every 10s)',
    streaming: { active: false, tokens: 0 },
    promptOpen: false,
  },
};

export function BottomBarProvider({ children }: { children: React.ReactNode }) {
  const stateRef = useRef<BottomContribution>({ ...DEFAULT_STATE });
  const [version, setVersion] = useState(0); // force re-render when state changes
  const [ephemeral, setEphemeral] = useState<EphemeralMessage | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const set = (contrib: BottomContribution) => {
    stateRef.current = {
      ...DEFAULT_STATE,
      ...contrib,
      editor: { ...DEFAULT_STATE.editor, ...contrib.editor },
    };
    setVersion((v) => v + 1);
  };

  const patch = (contrib: Partial<BottomContribution>) => {
    stateRef.current = {
      ...stateRef.current,
      ...contrib,
      editor: { ...stateRef.current.editor, ...contrib.editor },
    };
    setVersion((v) => v + 1);
  };

  const pushMessage = (msg: EphemeralMessage) => {
    setEphemeral(msg);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    const timeout = window.setTimeout(() => setEphemeral(null), msg.timeoutMs ?? 2000);
    timeoutRef.current = timeout as unknown as number;
  };

  const togglePrompt = () => {
    const current = stateRef.current.editor ?? {};
    stateRef.current = {
      ...stateRef.current,
      editor: { ...current, promptOpen: !current.promptOpen },
    };
    setVersion((v) => v + 1);
  };

  const closePrompt = () => {
    const current = stateRef.current.editor ?? {};
    if (!current.promptOpen) return;
    stateRef.current = {
      ...stateRef.current,
      editor: { ...current, promptOpen: false },
    };
    setVersion((v) => v + 1);
  };

  const api: BottomBarAPI = useMemo(
    () => ({
      set,
      patch,
      pushMessage,
      togglePrompt,
      closePrompt,
      getState: () => stateRef.current,
    }),
    [],
  );

  const value = useMemo<Ctx>(
    () => ({ ...stateRef.current, api, ephemeral, _v: version }) as unknown as Ctx,
    [api, ephemeral, version],
  );

  return (
    <BottomBarContext.Provider value={value}>{children}</BottomBarContext.Provider>
  );
}

export function useBottomBar() {
  const ctx = useContext(BottomBarContext);
  if (!ctx) throw new Error('useBottomBar must be used within BottomBarProvider');
  return ctx.api;
}

export function useBottomBarState() {
  const ctx = useContext(BottomBarContext);
  if (!ctx) throw new Error('useBottomBarState must be used within BottomBarProvider');
  return ctx;
}
