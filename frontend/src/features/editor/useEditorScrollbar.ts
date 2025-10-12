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

export function useEditorScrollbar(
  isActive: boolean,
  contentKey: unknown,
  hideDelay = 1500,
) {
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);
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
      setScrollState((current) => ({ ...current, scrollable: false }));
      return;
    }

    setScrollState((current) => ({
      ...current,
      scrollable: node.scrollHeight - node.clientHeight > 4,
    }));
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      setScrollState({ mode: "hidden", scrollable: false });
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
      setScrollState((current) => ({ ...current, mode: "hidden" }));
    }, hideDelay);
  }, [clearHideTimer, hideDelay]);

  const reveal = useCallback(() => {
    if (!scrollable) return;
    setScrollState((current) => ({ ...current, mode: "visible" }));
    scheduleHide();
  }, [scheduleHide, scrollable]);

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
    if (!scrollable) return;
    scheduleHide();
  }, [scheduleHide, scrollable]);

  const handlers: EditorScrollbarHandlers = {
    onScroll: handleScroll,
    onMouseEnter: handlePointerEnter,
    onMouseMove: handlePointerEnter,
    onMouseLeave: handlePointerLeave,
  };

  const className = `editor-scroll-area ${
    scrollable ? `scrollbar-${mode}` : "scrollbar-disabled"
  }`;

  return {
    scrollAreaRef,
    handlers,
    scrollbarClassName: className,
    scrollable,
  };
}
