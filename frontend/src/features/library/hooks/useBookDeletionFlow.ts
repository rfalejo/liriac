import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import type { LibraryBook } from "../../../api/library";

type UseBookDeletionFlowArgs = {
  book: LibraryBook;
  deleteBook: (args: { bookId: string }) => Promise<unknown>;
  isDeleting: boolean;
  onClose: () => void;
  onError: (message: string) => void;
  onResetError: () => void;
};

export function useBookDeletionFlow({
  book,
  deleteBook,
  isDeleting,
  onClose,
  onError,
  onResetError,
}: UseBookDeletionFlowArgs) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const openDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(true);
    setDeleteConfirmation("");
    setDeleteErrorMessage(null);
    onResetError();
  }, [onResetError]);

  const closeDeleteDialog = useCallback(() => {
    if (isDeleting) {
      return;
    }
    setDeleteDialogOpen(false);
    setDeleteConfirmation("");
    setDeleteErrorMessage(null);
  }, [isDeleting]);

  const handleDeleteConfirmationChange = useCallback((value: string) => {
    setDeleteConfirmation(value);
    setDeleteErrorMessage(null);
  }, []);

  const handleConfirmDelete = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const expectedTitle = book.title.trim();
      if (deleteConfirmation.trim() !== expectedTitle) {
        setDeleteErrorMessage("El título no coincide. Intenta nuevamente.");
        return;
      }

      try {
        await deleteBook({ bookId: book.id });
        setDeleteDialogOpen(false);
        setDeleteConfirmation("");
        setDeleteErrorMessage(null);
        onResetError();
        onClose();
      } catch (error) {
        console.error("Failed to delete book", error);
        setDeleteErrorMessage("No se pudo eliminar el libro. Intenta nuevamente.");
        onError("No se pudo eliminar el libro. Intenta nuevamente.");
      }
    },
    [book.id, book.title, deleteBook, deleteConfirmation, onClose, onError, onResetError],
  );

  return {
    deleteDialogOpen,
    deleteConfirmation,
    deleteErrorMessage,
    openDeleteDialog,
    closeDeleteDialog,
    handleDeleteConfirmationChange,
    handleConfirmDelete,
  };
}
