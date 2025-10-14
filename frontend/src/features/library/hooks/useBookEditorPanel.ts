import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { ContextSection, LibraryBook } from "../../../api/library";
import {
  makeContextKey,
  type ContextEditableField,
  type ContextItemFormValue,
  type ContextSectionId,
} from "../components/bookContextHelpers";
import { useUpsertBook } from "./useUpsertBook";
import { useDeleteBook } from "./useDeleteBook";
import {
  useBookMetadataForm,
  type BookEditorFormState,
} from "./useBookMetadataForm";
import { useBookContextEditor } from "./useBookContextEditor";
import { useBookDeletionFlow } from "./useBookDeletionFlow";

export type BookEditorTabValue = "metadata" | "context";

type UseBookEditorPanelArgs = {
  book: LibraryBook;
  onClose: () => void;
  focusTab?: BookEditorTabValue;
  focusRequest?: number;
};

type UseBookEditorPanelResult = {
  formState: BookEditorFormState;
  activeTab: BookEditorTabValue;
  handleTabChange: (value: BookEditorTabValue) => void;
  contextSections: ContextSection[];
  contextFormValues: Record<string, ContextItemFormValue>;
  contextLoading: boolean;
  contextError: Error | null;
  errorMessage: string | null;
  disableActions: boolean;
  metadataHasChanges: boolean;
  contextHasChanges: boolean;
  deleteDialogOpen: boolean;
  deleteConfirmation: string;
  deleteErrorMessage: string | null;
  isDeleting: boolean;
  creatingContextSection: ContextSectionId | null;
  isCreatingContextItem: boolean;
  handleFieldChange: (
    field: keyof BookEditorFormState,
    value: string,
  ) => void;
  handleContextFieldChange: (
    sectionSlug: string,
    itemId: string,
    chapterId: string | null,
    type: ContextItemFormValue["type"],
    field: ContextEditableField,
    value: string,
  ) => void;
  handleAddContextItem: (sectionId: ContextSectionId) => void;
  requestContextItemDeletion: (details: PendingContextDeletion) => void;
  cancelContextItemDeletion: () => void;
  confirmContextItemDeletion: () => Promise<void>;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  reloadContext: () => void;
  openDeleteDialog: () => void;
  closeDeleteDialog: () => void;
  handleDeleteConfirmationChange: (value: string) => void;
  handleConfirmDelete: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  deletingContextItems: Record<string, boolean>;
  pendingContextDeletion: PendingContextDeletion | null;
  pendingContextDeletionKey: string | null;
  isDeletingContextMutation: boolean;
};

type PendingContextDeletion = {
  sectionSlug: string;
  itemId: string;
  chapterId: string | null;
  label: string;
};

export function useBookEditorPanel({
  book,
  onClose,
  focusTab = "metadata",
  focusRequest = 0,
}: UseBookEditorPanelArgs): UseBookEditorPanelResult {
  const {
    mutateAsync: upsertBook,
    isPending: isSaving,
  } = useUpsertBook();
  const {
    mutateAsync: deleteBook,
    isPending: isDeleting,
  } = useDeleteBook();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BookEditorTabValue>("metadata");

  const clearError = useCallback(() => setErrorMessage(null), []);

  const {
    formState,
    handleFieldChange,
    metadataHasChanges,
    submitMetadata,
  } = useBookMetadataForm({
    book,
    upsertBook: (args) => upsertBook(args),
    onValidationError: setErrorMessage,
    onRequestError: setErrorMessage,
    onSuccess: clearError,
  });

  const {
    contextSections,
    contextFormValues,
    contextLoading,
    contextError,
    contextHasChanges,
    handleContextFieldChange,
    handleAddContextItem,
    deleteContextItem,
    submitContextUpdates,
    reloadContext,
    creatingContextSection,
    isCreatingContextItem,
    isUpdatingContext,
    deletingContextItems,
    isDeletingContextMutation,
  } = useBookContextEditor({
    bookId: book.id,
    onClearError: clearError,
    onMutationError: setErrorMessage,
  });

  const [pendingContextDeletion, setPendingContextDeletion] = useState<
    PendingContextDeletion | null
  >(null);

  const pendingContextDeletionKey = pendingContextDeletion
    ? makeContextKey(
        pendingContextDeletion.sectionSlug,
        pendingContextDeletion.itemId,
        pendingContextDeletion.chapterId,
      )
    : null;

  const requestContextItemDeletion = useCallback(
    (details: PendingContextDeletion) => {
      setPendingContextDeletion(details);
    },
    [],
  );

  const cancelContextItemDeletion = useCallback(() => {
    setPendingContextDeletion(null);
  }, []);

  const confirmContextItemDeletion = useCallback(async () => {
    if (!pendingContextDeletion) {
      return;
    }
    const success = await deleteContextItem(
      pendingContextDeletion.sectionSlug,
      pendingContextDeletion.itemId,
      pendingContextDeletion.chapterId,
    );
    if (success) {
      setPendingContextDeletion(null);
    }
  }, [deleteContextItem, pendingContextDeletion]);

  const {
    deleteDialogOpen,
    deleteConfirmation,
    deleteErrorMessage,
    openDeleteDialog,
    closeDeleteDialog,
    handleDeleteConfirmationChange,
    handleConfirmDelete,
  } = useBookDeletionFlow({
    book,
    deleteBook: (args) => deleteBook(args),
    isDeleting,
    onClose,
    onError: setErrorMessage,
    onResetError: clearError,
  });

  useEffect(() => {
    setActiveTab(focusTab);
  }, [focusTab, focusRequest]);

  const disableActions =
    isSaving ||
    isUpdatingContext ||
    isDeleting ||
    isCreatingContextItem ||
  isDeletingContextMutation;

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (activeTab === "metadata") {
        await submitMetadata();
        return;
      }

      await submitContextUpdates();
    },
    [activeTab, submitContextUpdates, submitMetadata],
  );

  const handleTabChange = useCallback((value: BookEditorTabValue) => {
    setActiveTab(value);
  }, []);

  return {
    formState,
    activeTab,
    handleTabChange,
    contextSections,
    contextFormValues,
    contextLoading,
    contextError,
    errorMessage,
    disableActions,
    metadataHasChanges,
    contextHasChanges,
    deleteDialogOpen,
    deleteConfirmation,
    deleteErrorMessage,
    isDeleting,
    creatingContextSection,
    isCreatingContextItem,
    handleFieldChange,
    handleContextFieldChange,
    handleAddContextItem,
    requestContextItemDeletion,
    cancelContextItemDeletion,
    confirmContextItemDeletion,
    handleSubmit,
    reloadContext,
    openDeleteDialog,
    closeDeleteDialog,
    handleDeleteConfirmationChange,
    handleConfirmDelete,
    deletingContextItems,
    pendingContextDeletion,
    pendingContextDeletionKey,
    isDeletingContextMutation,
  };
}
