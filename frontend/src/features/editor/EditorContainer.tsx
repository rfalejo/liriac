import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";
import type { components } from "../../api/schema";
import { useEditorScrollbar } from "./hooks/useEditorScrollbar";
import { useEditorChapterNavigation } from "./hooks/useEditorChapterNavigation";
import { EditorShell } from "./EditorShell";
import { useUpdateChapterBlock } from "./hooks/useUpdateChapterBlock";
import { useCreateChapterBlock } from "./hooks/useCreateChapterBlock";
import { useEditorEditingState } from "./hooks/useEditorEditingState";
import { useDeleteChapterBlock } from "./hooks/useDeleteChapterBlock";
import { showBlockUpdateErrorToast } from "./utils/showBlockUpdateErrorToast";
import type { EditingDiscardContext } from "./hooks/editing/types";
import { ConfirmationDialog } from "./components/ConfirmationDialog";
import {
  useEditorConfirmDialog,
  type ConfirmDialogOptions,
} from "./hooks/useEditorConfirmDialog";
import {
  attachPosition,
  buildDefaultBlockPayload,
  generateBlockId,
} from "./utils/blockCreation";
import { ContextConfigurationPanel } from "./contextPanel";
import { usePinnedHoverPanel } from "./hooks/usePinnedHoverPanel";
import { useBlockConversion } from "./hooks/useBlockConversion";
import type { BlockInsertPosition } from "./blocks/BlockInsertMenu";
import { BlockConversionDialog } from "./conversions/BlockConversionDialog";
import { EditorSidebar } from "./EditorSidebar";
import { QuickActionsDrawer, type QuickActionsTab } from "./components/QuickActionsDrawer";
import { GeneralSuggestionDialog } from "./suggestions/GeneralSuggestionDialog";

const QUICK_ACTIONS_TAB_STORAGE_KEY = "editor.quickActions.activeTab";

type ChapterBlockType = components["schemas"]["ChapterBlockTypeEnum"];


type EditorContainerProps = {
  chapterId: string;
  open: boolean;
  onClose: () => void;
};

export function EditorContainer({
  chapterId,
  open,
  onClose,
}: EditorContainerProps) {
  const theme = useTheme();
  const isMobileLayout = useMediaQuery(theme.breakpoints.down("lg"));
  const {
    activeChapterId,
    chapter,
    chapterOptions,
    booksError,
    booksLoading,
    bookTitle,
    contentSignature,
    error,
    handleSelectChapter,
    loading,
    reload,
  } = useEditorChapterNavigation({ chapterId });

  const { scrollAreaRef, handlers, scrollbarState } = useEditorScrollbar(
    open,
    contentSignature,
  );

  const { updateBlock, isPending: blockUpdatePending } = useUpdateChapterBlock({
    chapterId: chapter?.id,
  });

  const { createBlock, isPending: blockCreatePending } = useCreateChapterBlock({
    chapterId: chapter?.id,
  });

  const { deleteBlock, isPending: blockDeletePending } = useDeleteChapterBlock({
    chapterId: chapter?.id,
  });

  const { dialogState: confirmDialog, openConfirmDialog, resolveDialog } =
    useEditorConfirmDialog();

  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [quickActionsTab, setQuickActionsTab] = useState<QuickActionsTab>("chapters");
  const quickActionsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [generalSuggestionOpen, setGeneralSuggestionOpen] = useState(false);

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
    if (!open) {
      setQuickActionsOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!isMobileLayout) {
      setQuickActionsOpen(false);
    }
  }, [isMobileLayout]);

  const handleConfirmClose = useCallback(
    (decision: boolean) => {
      resolveDialog(decision);
    },
    [resolveDialog],
  );

  const confirmDiscardChanges = useCallback(
    (context: EditingDiscardContext) => {
      const options: ConfirmDialogOptions =
        context === "cancel"
          ? {
              title: "Descartar cambios",
              description:
                "Tienes cambios sin guardar en este bloque. ¿Quieres descartarlos?",
              confirmLabel: "Descartar cambios",
              cancelLabel: "Seguir editando",
              tone: "warning",
            }
          : {
              title: "Cambiar de bloque",
              description:
                "Tienes cambios sin guardar. ¿Quieres descartarlos y cambiar de bloque?",
              confirmLabel: "Cambiar y descartar",
              cancelLabel: "Seguir editando",
              tone: "warning",
            };

      return openConfirmDialog(options);
    },
    [openConfirmDialog],
  );

  const confirmDeleteBlock = useCallback(
    () =>
      openConfirmDialog({
        title: "Eliminar bloque",
        description:
          "¿Quieres eliminar este bloque? No podrás deshacer esta acción.",
        confirmLabel: "Eliminar bloque",
        cancelLabel: "Cancelar",
        tone: "danger",
      }),
    [openConfirmDialog],
  );

  const confirmDeleteBlockVersion = useCallback(
    () =>
      openConfirmDialog({
        title: "Eliminar versión",
        description:
          "¿Quieres eliminar esta versión del bloque? No podrás deshacer esta acción.",
        confirmLabel: "Eliminar versión",
        cancelLabel: "Cancelar",
        tone: "danger",
      }),
    [openConfirmDialog],
  );

  const notifyUpdateFailure = useCallback((error: unknown) => {
    showBlockUpdateErrorToast(error);
  }, []);

  const blockMutationPending = blockUpdatePending || blockCreatePending;
  const mutationPending = blockMutationPending || blockDeletePending;

  const deleteBlockById = useCallback(
    (blockId: string) => deleteBlock({ blockId }),
    [deleteBlock],
  );

  const { editingState, handleEditBlock } = useEditorEditingState({
    chapter,
    updateBlock,
    deleteBlock: deleteBlockById,
    blockUpdatePending: blockMutationPending,
    blockDeletePending,
    sideEffects: {
      confirmDiscardChanges,
      confirmDeleteBlock,
      confirmDeleteBlockVersion,
      notifyUpdateFailure,
    },
  });

  const handleEditBlockRef = useRef(handleEditBlock);

  useEffect(() => {
    handleEditBlockRef.current = handleEditBlock;
  }, [handleEditBlock]);

  const handleInsertBlock = useCallback(
    (
      blockType: ChapterBlockType,
      position: {
        afterBlockId: string | null;
        beforeBlockId: string | null;
        index: number;
      },
    ) => {
      if (!chapter?.id || mutationPending) {
        return;
      }

      const blockId = generateBlockId();
      const payload = attachPosition(
        buildDefaultBlockPayload(blockType, blockId),
        position,
        chapter,
      );

      createBlock({ payload })
        .then(() => {
          setTimeout(() => {
            handleEditBlockRef.current(blockId);
          }, 0);
        })
        .catch((error) => {
          notifyUpdateFailure(error);
        });
    },
    [chapter, createBlock, mutationPending, notifyUpdateFailure],
  );
  const leftPanelControls = usePinnedHoverPanel({ enabled: open && !isMobileLayout });
  const rightPanelControls = usePinnedHoverPanel({ enabled: open && !isMobileLayout });

  const selectedChapterId = chapter?.id ?? activeChapterId;

  const sidebarProps = useMemo(
    () => ({
      activeChapterId: selectedChapterId,
      bookTitle,
      chapters: chapterOptions,
      error: booksError,
      loading: booksLoading,
      onSelectChapter: handleSelectChapter,
      onReturnToLibrary: onClose,
    }),
    [
      selectedChapterId,
      bookTitle,
      chapterOptions,
      booksError,
      booksLoading,
      handleSelectChapter,
      onClose,
    ],
  );

  const {
    draft: conversionDraft,
    dialogOpen: conversionDialogOpen,
    conversionText,
    canSubmitConversion,
    conversionPending,
    conversionError,
    applyPending: conversionApplying,
    applyError: conversionApplyError,
    canOpenDialog: conversionCanOpenDialog,
    openDialog: openConversionDialog,
    closeDialog: closeConversionDialog,
    setConversionText,
    submitConversion,
    acceptDraft,
    rejectDraft,
    clearConversionError,
  } = useBlockConversion({ chapterId: chapter?.id });

  const conversionActionsDisabled =
    !conversionCanOpenDialog ||
    conversionPending ||
    conversionApplying ||
    Boolean(conversionDraft) ||
    mutationPending ||
    !chapter?.id;

  const mobileQuickActionsHotspot = isMobileLayout
    ? (
        <Box
          component="button"
          type="button"
          ref={quickActionsTriggerRef}
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
      )
    : null;

  const handleCloseQuickActions = useCallback(() => {
    setQuickActionsOpen(false);
    quickActionsTriggerRef.current?.focus({ preventScroll: true });
  }, []);

  const handleChangeQuickActionsTab = useCallback((tab: QuickActionsTab) => {
    setQuickActionsTab(tab);
  }, []);

  const generalSuggestionDisabled = !chapter?.id;
  const quickActionHeaderActions = (
    <Tooltip
      title={generalSuggestionDisabled ? "Selecciona un capítulo" : "Sugerencia general"}
      arrow
    >
      <span>
        <IconButton
          size="small"
          aria-label="Sugerencia general"
          onClick={() => {
            if (generalSuggestionDisabled) {
              return;
            }
            setGeneralSuggestionOpen(true);
          }}
          disabled={generalSuggestionDisabled}
          sx={(theme) => ({
            color: theme.palette.editor.blockMenuIcon,
            transition: theme.editor.iconButtonTransition,
            "&:hover": {
              backgroundColor: theme.palette.editor.blockMenuHoverBg,
              color: theme.palette.editor.blockMenuIconHover,
            },
            "&.Mui-disabled": {
              color: theme.palette.action.disabled,
            },
          })}
        >
          <AutoFixHighRoundedIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  );

  return (
    <>
      {mobileQuickActionsHotspot}
      <EditorShell
      sidebarProps={sidebarProps}
      leftPanel={{
        title: "Capítulos",
        pinned: leftPanelControls.pinned,
        visible: leftPanelControls.visible,
        onTogglePin: leftPanelControls.togglePinned,
        onClose: leftPanelControls.close,
        onEnter: leftPanelControls.handleEnter,
        onLeave: leftPanelControls.handleLeave,
        width: 300,
        triggerWidth: 28,
      }}
      chapterViewProps={{
        loading,
        error,
        chapter,
        onRetry: reload,
        onEditBlock: handleEditBlock,
        onInsertBlock: handleInsertBlock,
        onOpenConversion: conversionActionsDisabled
          ? undefined
          : (position: BlockInsertPosition) => {
              openConversionDialog(position);
            },
        conversionDisabled: conversionActionsDisabled,
        conversionDraft,
        conversionApplying,
        conversionApplyError,
        onAcceptConversion: () => {
          void acceptDraft();
        },
        onRejectConversion: rejectDraft,
        editingState,
      }}
      chapterTopSlot={null}
      scrollAreaRef={scrollAreaRef}
      scrollHandlers={handlers}
      scrollbarState={scrollbarState}
      rightPanel={{
        title: "Configuración de contexto",
        pinned: rightPanelControls.pinned,
        visible: rightPanelControls.visible,
        onTogglePin: rightPanelControls.togglePinned,
        onClose: rightPanelControls.close,
        onEnter: rightPanelControls.handleEnter,
        onLeave: rightPanelControls.handleLeave,
        width: 340,
        triggerWidth: 32,
        content: (
          <ContextConfigurationPanel
            chapterId={chapter?.id ?? null}
            bookTitle={bookTitle ?? null}
            showHeading={false}
          />
        ),
      }}
    >
      <ConfirmationDialog
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title ?? ""}
        description={confirmDialog?.description ?? ""}
        confirmLabel={confirmDialog?.confirmLabel ?? ""}
        cancelLabel={confirmDialog?.cancelLabel ?? ""}
        tone={confirmDialog?.tone ?? "warning"}
        confirmDisabled={mutationPending}
        onClose={handleConfirmClose}
      />
      <BlockConversionDialog
        open={conversionDialogOpen}
        value={conversionText}
        onChange={setConversionText}
        onClose={closeConversionDialog}
        onSubmit={() => {
          if (!canSubmitConversion || conversionActionsDisabled) {
            return;
          }
          void submitConversion();
        }}
        submitting={conversionPending}
        disabled={Boolean(conversionDraft) || mutationPending || conversionApplying}
        error={conversionError}
        onClearError={clearConversionError}
        canSubmit={canSubmitConversion && !conversionActionsDisabled}
      />
      <GeneralSuggestionDialog
        open={generalSuggestionOpen}
        onClose={() => {
          setGeneralSuggestionOpen(false);
        }}
        chapterId={chapter?.id ?? null}
        blocks={chapter?.blocks ?? []}
      />
      {isMobileLayout ? (
        <QuickActionsDrawer
          open={quickActionsOpen}
          onOpen={() => {
            setQuickActionsOpen(true);
          }}
          onClose={handleCloseQuickActions}
          activeTab={quickActionsTab}
          onChangeTab={handleChangeQuickActionsTab}
          chaptersContent={
            <EditorSidebar
              {...sidebarProps}
              hideTitle={false}
            />
          }
          contextContent={
            <ContextConfigurationPanel
              chapterId={chapter?.id ?? null}
              bookTitle={bookTitle ?? null}
              showHeading
            />
          }
          headerActions={quickActionHeaderActions}
        />
      ) : null}
      </EditorShell>
    </>
  );
}
