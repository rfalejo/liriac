import { useCallback, useEffect, useRef } from "react";
import Stack from "@mui/material/Stack";
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
import { DraftConversionPreview } from "./conversions/DraftConversionPreview";
import { BlockConversionDialog } from "./conversions/BlockConversionDialog";

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
  const leftPanelControls = usePinnedHoverPanel({ enabled: open });
  const rightPanelControls = usePinnedHoverPanel({ enabled: open });

  const selectedChapterId = chapter?.id ?? activeChapterId;

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

  const chapterTopSlot = chapter && conversionDraft ? (
    <Stack spacing={2.5}>
      <DraftConversionPreview
        blocks={conversionDraft.blocks}
        onAccept={() => {
          void acceptDraft();
        }}
        onReject={rejectDraft}
        accepting={conversionApplying}
        error={conversionApplyError}
      />
    </Stack>
  ) : null;

  return (
    <EditorShell
      sidebarProps={{
        activeChapterId: selectedChapterId,
        bookTitle,
        chapters: chapterOptions,
        error: booksError,
        loading: booksLoading,
        onSelectChapter: handleSelectChapter,
        onReturnToLibrary: onClose,
      }}
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
          : openConversionDialog,
        conversionDisabled: conversionActionsDisabled,
        editingState,
      }}
      chapterTopSlot={chapterTopSlot}
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
    </EditorShell>
  );
}
