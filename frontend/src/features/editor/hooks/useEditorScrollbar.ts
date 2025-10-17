import {
  type MouseEventHandler,
  type UIEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type EditorScrollbarHandlers = {
  onScroll: UIEventHandler<HTMLDivElement>;
  onMouseEnter: MouseEventHandler<HTMLDivElement>;
  onMouseMove: MouseEventHandler<HTMLDivElement>;
  onMouseLeave: MouseEventHandler<HTMLDivElement>;
};

type ScrollState = {
  mode: "hidden" | "visible";
  scrollable: boolean;
};

export type ScrollbarState = {
  mode: "hidden" | "visible";
  scrollable: boolean;
};

export function useEditorScrollbar(
  isActive: boolean,
  contentKey: unknown,
  hideDelay = 1500,
) {
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const scrollableRef = useRef(false);
  const modeRef = useRef<"hidden" | "visible">("hidden");
  const [{ mode, scrollable }, setScrollState] = useState<ScrollState>(() => ({
    mode: "hidden",
    scrollable: false,
  }));

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const evaluateScrollable = useCallback(() => {
    const node = scrollAreaRef.current;
    if (!node || !isActive) {
      scrollableRef.current = false;
      setScrollState((current) => {
        if (!current.scrollable && current.mode === "hidden") {
          return current;
        }
        modeRef.current = "hidden";
        return { mode: "hidden", scrollable: false };
      });
      return;
    }

    const nextScrollable = node.scrollHeight - node.clientHeight > 4;
    scrollableRef.current = nextScrollable;
    setScrollState((current) => {
      if (current.scrollable === nextScrollable) {
        return current;
      }
      const nextMode = nextScrollable ? current.mode : "hidden";
      modeRef.current = nextMode;
      return { mode: nextMode, scrollable: nextScrollable };
    });
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      scrollableRef.current = false;
      modeRef.current = "hidden";
      setScrollState((current) => {
        if (current.mode === "hidden" && !current.scrollable) {
          return current;
        }
        return { mode: "hidden", scrollable: false };
      });
      return;
    }

    const id = window.requestAnimationFrame(evaluateScrollable);
    return () => window.cancelAnimationFrame(id);
  }, [evaluateScrollable, isActive, contentKey]);

  useEffect(
    () => () => {
      clearHideTimer();
    },
    [clearHideTimer],
  );

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setScrollState((current) => {
        if (current.mode === "hidden") {
          return current;
        }
        modeRef.current = "hidden";
        return { ...current, mode: "hidden" };
      });
    }, hideDelay);
  }, [clearHideTimer, hideDelay]);

  const reveal = useCallback(() => {
    if (!scrollableRef.current) {
      return;
    }
    if (modeRef.current !== "visible") {
      setScrollState((current) => {
        if (current.mode === "visible") {
          return current;
        }
        modeRef.current = "visible";
        return { ...current, mode: "visible" };
      });
    }
    scheduleHide();
  }, [scheduleHide]);

  const handleScroll = useCallback<UIEventHandler<HTMLDivElement>>(() => {
    reveal();
  }, [reveal]);

  const handlePointerEnter = useCallback<
    MouseEventHandler<HTMLDivElement>
  >(() => {
    reveal();
  }, [reveal]);

  const handlePointerLeave = useCallback<
    MouseEventHandler<HTMLDivElement>
  >(() => {
    if (!scrollableRef.current) return;
    scheduleHide();
  }, [scheduleHide]);

  const handlers: EditorScrollbarHandlers = {
    onScroll: handleScroll,
    onMouseEnter: handlePointerEnter,
    onMouseMove: handlePointerEnter,
    onMouseLeave: handlePointerLeave,
  };

  const scrollbarState: ScrollbarState = {
    mode,
    scrollable,
  };

  return {
    scrollAreaRef,
    handlers,
    scrollbarState,
    scrollable,
  };
}
