import { useMemo } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useEditorScrollbar } from "./hooks/useEditorScrollbar";
import { useEditorChapterNavigation } from "./hooks/useEditorChapterNavigation";
import { EditorShell } from "./EditorShell";
import { ConfirmationDialog } from "./components/ConfirmationDialog";
import { ContextConfigurationPanel } from "./contextPanel";
import { usePinnedHoverPanel } from "./hooks/usePinnedHoverPanel";
import { useBlockConversion } from "./hooks/useBlockConversion";
import type { BlockInsertPosition } from "./blocks/BlockInsertMenu";
import { BlockConversionDialog } from "./conversions/BlockConversionDialog";
import { useEditorBlockOperations } from "./hooks/useEditorBlockOperations";
import { useQuickActionsPanel } from "./hooks/useQuickActionsPanel";


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

  const {
    editingStore,
    handleEditBlock,
    handleInsertBlock,
    confirmDialog,
    handleConfirmClose,
    mutationPending,
  } = useEditorBlockOperations({ chapter });
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

  const quickActions = useQuickActionsPanel({
    isMobileLayout,
    editorOpen: open,
    chapterId: chapter?.id ?? null,
    bookTitle: bookTitle ?? null,
    blocks: chapter?.blocks ?? [],
    sidebarProps,
  });

  return (
    <>
      {quickActions.mobileHotspot}
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
          editingStore,
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
        {quickActions.overlays}
      </EditorShell>
    </>
  );
}
