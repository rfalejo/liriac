import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { ContextSection, LibraryBook } from "../../../api/library";
import type {
  ContextEditableField,
  ContextItemFormValue,
  ContextSectionId,
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
  handleDeleteContextItem: (
    sectionSlug: string,
    itemId: string,
    chapterId: string | null,
  ) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  reloadContext: () => void;
  openDeleteDialog: () => void;
  closeDeleteDialog: () => void;
  handleDeleteConfirmationChange: (value: string) => void;
  handleConfirmDelete: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  deletingContextItems: Record<string, boolean>;
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
    handleDeleteContextItem,
    submitContextUpdates,
    reloadContext,
    creatingContextSection,
    isCreatingContextItem,
    isUpdatingContext,
    deletingContextItems,
    isDeletingContextItem,
  } = useBookContextEditor({
    bookId: book.id,
    onClearError: clearError,
    onMutationError: setErrorMessage,
  });

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
    isDeletingContextItem;

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
    handleDeleteContextItem,
    handleSubmit,
    reloadContext,
    openDeleteDialog,
    closeDeleteDialog,
    handleDeleteConfirmationChange,
    handleConfirmDelete,
    deletingContextItems,
  };
}
