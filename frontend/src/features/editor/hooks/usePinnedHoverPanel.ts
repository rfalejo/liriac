import { useCallback, useEffect, useRef, useState } from "react";

export type UsePinnedHoverPanelOptions = {
  enabled: boolean;
  hideDelayMs?: number;
  initialPinned?: boolean;
};

export type PinnedHoverPanelControls = {
  visible: boolean;
  pinned: boolean;
  togglePinned: () => void;
  close: () => void;
  handleEnter: () => void;
  handleLeave: () => void;
};

export function usePinnedHoverPanel({
  enabled,
  hideDelayMs = 220,
  initialPinned = false,
}: UsePinnedHoverPanelOptions): PinnedHoverPanelControls {
  const [pinned, setPinned] = useState(initialPinned);
  const [hovering, setHovering] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const handleEnter = useCallback(() => {
    if (!enabled) {
      return;
    }
    clearHideTimer();
    setHovering(true);
  }, [clearHideTimer, enabled]);

  const handleLeave = useCallback(() => {
    if (!enabled) {
      return;
    }
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setHovering(false);
      hideTimerRef.current = null;
    }, hideDelayMs);
  }, [clearHideTimer, enabled, hideDelayMs]);

  const togglePinned = useCallback(() => {
    setPinned((prev) => !prev);
  }, []);

  const close = useCallback(() => {
    setPinned(false);
    setHovering(false);
    clearHideTimer();
  }, [clearHideTimer]);

  useEffect(() => {
    if (!enabled) {
      setPinned(false);
      setHovering(false);
      clearHideTimer();
      return;
    }
    setPinned(initialPinned);
  }, [enabled, initialPinned, clearHideTimer]);

  useEffect(
    () => () => {
      clearHideTimer();
    },
    [clearHideTimer],
  );

  const visible = enabled && (pinned || hovering);

  return {
    visible,
    pinned,
    togglePinned,
    close,
    handleEnter,
    handleLeave,
  };
}
