import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LibraryBook } from "../../../api/library";

export type BookEditorFormState = {
  title: string;
  author: string;
  synopsis: string;
};

type UseBookMetadataFormArgs = {
  book: LibraryBook;
  upsertBook: (args: {
    mode: "update";
    bookId: string;
    payload: {
      title: string;
      author: string;
      synopsis: string;
    };
  }) => Promise<unknown>;
  onValidationError: (message: string) => void;
  onRequestError: (message: string) => void;
  onSuccess: () => void;
};

type MetadataSubmissionResult = {
  success: boolean;
};

const EMPTY_FORM_STATE: BookEditorFormState = {
  title: "",
  author: "",
  synopsis: "",
};

export function useBookMetadataForm({
  book,
  upsertBook,
  onValidationError,
  onRequestError,
  onSuccess,
}: UseBookMetadataFormArgs) {
  const [formState, setFormState] = useState<BookEditorFormState>(EMPTY_FORM_STATE);
  const initialRef = useRef<BookEditorFormState>(EMPTY_FORM_STATE);

  useEffect(() => {
    const nextState: BookEditorFormState = {
      title: book.title,
      author: book.author ?? "",
      synopsis: book.synopsis ?? "",
    };
    setFormState(nextState);
    initialRef.current = nextState;
  }, [book]);

  const handleFieldChange = useCallback(
    (field: keyof BookEditorFormState, value: string) => {
      setFormState((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const metadataHasChanges = useMemo(() => {
    const initial = initialRef.current;
    return (
      formState.title !== initial.title ||
      formState.author !== initial.author ||
      formState.synopsis !== initial.synopsis
    );
  }, [formState]);

  const submitMetadata = useCallback(async (): Promise<MetadataSubmissionResult> => {
    const trimmedTitle = formState.title.trim();

    if (!trimmedTitle) {
      onValidationError("El título es obligatorio.");
      return { success: false };
    }

    if (!metadataHasChanges) {
      return { success: false };
    }

    const trimmedAuthor = formState.author.trim();
    const trimmedSynopsis = formState.synopsis.trim();

    try {
      await upsertBook({
        mode: "update",
        bookId: book.id,
        payload: {
          title: trimmedTitle,
          author: trimmedAuthor,
          synopsis: trimmedSynopsis,
        },
      });
    } catch (error) {
      console.error("Failed to update book", error);
      onRequestError("No se pudo guardar el libro. Intenta nuevamente.");
      return { success: false };
    }

    initialRef.current = {
      title: trimmedTitle,
      author: trimmedAuthor,
      synopsis: trimmedSynopsis,
    };

    setFormState({
      title: trimmedTitle,
      author: trimmedAuthor,
      synopsis: trimmedSynopsis,
    });

    onSuccess();
    return { success: true };
  }, [
    book.id,
    formState.author,
    formState.synopsis,
    formState.title,
    metadataHasChanges,
    onRequestError,
    onSuccess,
    onValidationError,
    upsertBook,
  ]);

  return {
    formState,
    handleFieldChange,
    metadataHasChanges,
    submitMetadata,
  };
}
