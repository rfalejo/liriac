import { useCallback, useEffect, useRef, useState } from "react";

type UseSidebarHoverOptions = {
  open: boolean;
  hideDelayMs?: number;
};

type SidebarHoverControls = {
  handleSidebarEnter: () => void;
  handleSidebarLeave: () => void;
  sidebarVisible: boolean;
};

export function useSidebarHover({
  open,
  hideDelayMs = 220,
}: UseSidebarHoverOptions): SidebarHoverControls {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const hideSidebarTimerRef = useRef<number | null>(null);

  const clearHideSidebarTimer = useCallback(() => {
    if (hideSidebarTimerRef.current !== null) {
      window.clearTimeout(hideSidebarTimerRef.current);
      hideSidebarTimerRef.current = null;
    }
  }, []);

  const handleSidebarEnter = useCallback(() => {
    clearHideSidebarTimer();
    setSidebarVisible(true);
  }, [clearHideSidebarTimer]);

  const handleSidebarLeave = useCallback(() => {
    clearHideSidebarTimer();
    hideSidebarTimerRef.current = window.setTimeout(() => {
      setSidebarVisible(false);
      hideSidebarTimerRef.current = null;
    }, hideDelayMs);
  }, [clearHideSidebarTimer, hideDelayMs]);

  useEffect(() => {
    if (!open) {
      setSidebarVisible(false);
      clearHideSidebarTimer();
    }
  }, [open, clearHideSidebarTimer]);

  useEffect(() => () => clearHideSidebarTimer(), [clearHideSidebarTimer]);

  return { sidebarVisible, handleSidebarEnter, handleSidebarLeave };
}
