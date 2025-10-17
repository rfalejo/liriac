import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import type { ComponentProps, ReactNode } from "react";
import { EditorSidebar } from "../EditorSidebar";
import { QuickActionsDrawer, type QuickActionsTab } from "../components/QuickActionsDrawer";
import { ContextConfigurationPanel } from "../contextPanel";

type UseQuickActionsPanelParams = {
  isMobileLayout: boolean;
  editorOpen: boolean;
  chapterId: string | null;
  bookTitle: string | null;
  sidebarProps: ComponentProps<typeof EditorSidebar>;
};

type UseQuickActionsPanelResult = {
  mobileHotspot: ReactNode;
  overlays: ReactNode;
};

const QUICK_ACTIONS_TAB_STORAGE_KEY = "editor.quickActions.activeTab";

export function useQuickActionsPanel({
  isMobileLayout,
  editorOpen,
  chapterId,
  bookTitle,
  sidebarProps,
}: UseQuickActionsPanelParams): UseQuickActionsPanelResult {
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [quickActionsTab, setQuickActionsTab] = useState<QuickActionsTab>("chapters");
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(QUICK_ACTIONS_TAB_STORAGE_KEY);
    if (stored === "chapters" || stored === "context") {
      setQuickActionsTab(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(QUICK_ACTIONS_TAB_STORAGE_KEY, quickActionsTab);
  }, [quickActionsTab]);

  useEffect(() => {
    if (!editorOpen) {
      setQuickActionsOpen(false);
    }
  }, [editorOpen]);

  useEffect(() => {
    if (!isMobileLayout) {
      setQuickActionsOpen(false);
    }
  }, [isMobileLayout]);

  const handleCloseQuickActions = useCallback(() => {
    setQuickActionsOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  const handleChangeQuickActionsTab = useCallback((tab: QuickActionsTab) => {
    setQuickActionsTab(tab);
  }, []);

  const mobileHotspot = useMemo(() => {
    if (!isMobileLayout) {
      return null;
    }

    return (
      <Box
        component="button"
        type="button"
        ref={triggerRef}
        aria-haspopup="dialog"
        aria-controls="quick-actions-drawer"
        aria-expanded={quickActionsOpen}
        aria-label="Mostrar acciones rápidas"
        onClick={() => {
          setQuickActionsOpen(true);
        }}
        sx={(theme) => ({
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "calc(env(safe-area-inset-top, 0px) + 64px)",
          paddingTop: "env(safe-area-inset-top, 0px)",
          zIndex: theme.zIndex.appBar + 1,
          border: 0,
          backgroundColor: "transparent",
          cursor: "pointer",
          opacity: 0,
          pointerEvents: quickActionsOpen ? "none" : "auto",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
          transition: "opacity 180ms ease, background-color 180ms ease",
          "&:focus-visible": {
            outline: `2px solid ${theme.palette.primary.light}`,
            opacity: 0.28,
            backgroundColor: "rgba(255, 255, 255, 0.18)",
          },
          "&:active": {
            opacity: 0.12,
            backgroundColor: "rgba(0, 0, 0, 0.08)",
          },
        })}
      />
    );
  }, [isMobileLayout, quickActionsOpen]);

  const overlays = useMemo(() => (
    <>
      {isMobileLayout ? (
        <QuickActionsDrawer
          open={quickActionsOpen}
          onOpen={() => {
            setQuickActionsOpen(true);
          }}
          onClose={handleCloseQuickActions}
          activeTab={quickActionsTab}
          onChangeTab={handleChangeQuickActionsTab}
          chaptersContent={<EditorSidebar {...sidebarProps} hideTitle={false} />}
          contextContent={(
            <ContextConfigurationPanel
              chapterId={chapterId}
              bookTitle={bookTitle}
              showHeading
            />
          )}
        />
      ) : null}
    </>
  ), [
    bookTitle,
    chapterId,
    handleChangeQuickActionsTab,
    handleCloseQuickActions,
    isMobileLayout,
    quickActionsOpen,
    quickActionsTab,
    sidebarProps,
  ]);

  return {
    mobileHotspot,
    overlays,
  } satisfies UseQuickActionsPanelResult;
}
