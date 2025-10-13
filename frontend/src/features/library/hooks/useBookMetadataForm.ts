import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LibraryBook } from "../../../api/library";

export type BookEditorFormState = {
  title: string;
  author: string;
  synopsis: string;
};

function areFormStatesEqual(
  a: BookEditorFormState,
  b: BookEditorFormState,
): boolean {
  return a.title === b.title && a.author === b.author && a.synopsis === b.synopsis;
}

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
  const lastLoadedRef = useRef<{
    bookId: string;
    snapshot: BookEditorFormState;
  } | null>(null);

  const metadataHasChanges = useMemo(() => {
    const initial = initialRef.current;
    return (
      formState.title !== initial.title ||
      formState.author !== initial.author ||
      formState.synopsis !== initial.synopsis
    );
  }, [formState]);

  useEffect(() => {
    const nextState: BookEditorFormState = {
      title: book.title,
      author: book.author ?? "",
      synopsis: book.synopsis ?? "",
    };
    const lastLoaded = lastLoadedRef.current;
    const sameBook = lastLoaded?.bookId === book.id;
    const matchesSnapshot = lastLoaded && areFormStatesEqual(nextState, lastLoaded.snapshot);

    if (sameBook) {
      if (metadataHasChanges || matchesSnapshot) {
        return;
      }
    }

    setFormState(nextState);
    initialRef.current = nextState;
    lastLoadedRef.current = { bookId: book.id, snapshot: nextState };
  }, [book, metadataHasChanges]);

  const handleFieldChange = useCallback(
    (field: keyof BookEditorFormState, value: string) => {
      setFormState((current) => ({ ...current, [field]: value }));
    },
    [],
  );

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

    lastLoadedRef.current = {
      bookId: book.id,
      snapshot: {
        title: trimmedTitle,
        author: trimmedAuthor,
        synopsis: trimmedSynopsis,
      },
    };

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
