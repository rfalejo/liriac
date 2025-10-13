import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type {
  ContextItemUpdate,
  ContextSection,
  LibraryBook,
} from "../../../api/library";
import {
  buildContextFormValues,
  cloneContextFormValues,
  CONTEXT_FIELDS_BY_SECTION,
  CONTEXT_SECTION_IDS_IN_ORDER,
  makeContextKey,
  type ContextEditableField,
  type ContextItemFormValue,
} from "../components/bookContextHelpers";
import { useUpsertBook } from "./useUpsertBook";
import { useDeleteBook } from "./useDeleteBook";
import { useLibrarySections } from "./useLibrarySections";
import { useUpdateLibraryContext } from "./useUpdateLibraryContext";

type BookEditorFormState = {
  title: string;
  author: string;
  synopsis: string;
};

const emptyFormState: BookEditorFormState = {
  title: "",
  author: "",
  synopsis: "",
};

export type BookEditorTabValue = "metadata" | "context";

type UseBookEditorPanelArgs = {
  book: LibraryBook;
  onClose: () => void;
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
  deleteDialogOpen: boolean;
  deleteConfirmation: string;
  deleteErrorMessage: string | null;
  isDeleting: boolean;
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
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  reloadContext: () => void;
  openDeleteDialog: () => void;
  closeDeleteDialog: () => void;
  handleDeleteConfirmationChange: (value: string) => void;
  handleConfirmDelete: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function useBookEditorPanel({
  book,
  onClose,
}: UseBookEditorPanelArgs): UseBookEditorPanelResult {
  const {
    mutateAsync: upsertBook,
    isPending: isSaving,
  } = useUpsertBook();
  const {
    mutateAsync: deleteBook,
    isPending: isDeleting,
  } = useDeleteBook();
  const {
    sections: rawSections,
    loading: contextLoading,
    error: contextError,
    reload: reloadContext,
  } = useLibrarySections(book.id);
  const { mutateAsync: updateContextItems, isPending: isUpdatingContext } =
    useUpdateLibraryContext(book.id);

  const [formState, setFormState] = useState<BookEditorFormState>(
    emptyFormState,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [contextFormValues, setContextFormValues] = useState<
    Record<string, ContextItemFormValue>
  >({});
  const contextInitialRef = useRef<Record<string, ContextItemFormValue>>({});
  const [activeTab, setActiveTab] = useState<BookEditorTabValue>("metadata");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteErrorMessage, setDeleteErrorMessage] =
    useState<string | null>(null);

  useEffect(() => {
    setFormState({
      title: book.title,
      author: book.author ?? "",
      synopsis: book.synopsis ?? "",
    });
    setActiveTab("metadata");
  }, [book]);

  const contextSections = useMemo(() => {
    const sectionsById = new Map<string, ContextSection>();
    for (const section of rawSections) {
      sectionsById.set(section.id, section);
    }

    return CONTEXT_SECTION_IDS_IN_ORDER.map((sectionId) =>
      sectionsById.get(sectionId),
    ).filter((section): section is ContextSection => Boolean(section));
  }, [rawSections]);

  useEffect(() => {
    const nextValues = buildContextFormValues(contextSections);
    setContextFormValues(nextValues);
    contextInitialRef.current = cloneContextFormValues(nextValues);
  }, [contextSections]);

  const disableActions = isSaving || isUpdatingContext || isDeleting;

  const handleFieldChange = useCallback(
    (field: keyof BookEditorFormState, value: string) => {
      setFormState((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const handleContextFieldChange = useCallback(
    (
      sectionSlug: string,
      itemId: string,
      chapterId: string | null,
      type: ContextItemFormValue["type"],
      field: ContextEditableField,
      value: string,
    ) => {
      const key = makeContextKey(sectionSlug, itemId, chapterId);

      setContextFormValues((current) => {
        const existing = current[key] ?? {
          id: itemId,
          sectionSlug,
          chapterId,
          type,
        };

        return {
          ...current,
          [key]: {
            ...existing,
            type: existing.type ?? type,
            chapterId: existing.chapterId ?? chapterId,
            [field]: value,
          },
        };
      });
    },
    [],
  );

  const buildContextUpdates = useCallback((): ContextItemUpdate[] => {
    const updates: ContextItemUpdate[] = [];

    for (const section of contextSections) {
      const sectionId = CONTEXT_SECTION_IDS_IN_ORDER.find(
        (id) => id === section.id,
      );
      if (!sectionId) {
        continue;
      }

      const descriptors = CONTEXT_FIELDS_BY_SECTION[sectionId];
      if (!descriptors?.length) {
        continue;
      }

      for (const item of section.items) {
        const key = makeContextKey(section.id, item.id, item.chapterId ?? null);
        const current = contextFormValues[key];
        const initial = contextInitialRef.current[key];

        if (!current || !initial) {
          continue;
        }

        const payload: Partial<ContextItemUpdate> = {
          id: current.id,
          sectionSlug: current.sectionSlug,
        };

        if (current.chapterId) {
          payload.chapterId = current.chapterId;
        } else if (initial.chapterId) {
          payload.chapterId = null;
        }

        let hasChanges = false;

        for (const descriptor of descriptors) {
          const field = descriptor.field;
          const currentValue = (current[field] ?? "").trim();
          const initialValue = (initial[field] ?? "").trim();

          if (currentValue !== initialValue) {
            payload[field] = currentValue;
            hasChanges = true;
          }
        }

        if (hasChanges) {
          updates.push(payload as ContextItemUpdate);
        }
      }
    }

    return updates;
  }, [contextFormValues, contextSections]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedTitle = formState.title.trim();
      if (!trimmedTitle) {
        setErrorMessage("El título es obligatorio.");
        return;
      }

      setErrorMessage(null);

      const contextUpdates = buildContextUpdates();

      try {
        await upsertBook({
          mode: "update",
          bookId: book.id,
          payload: {
            title: trimmedTitle,
            author: formState.author.trim(),
            synopsis: formState.synopsis.trim(),
          },
        });
      } catch (error) {
        console.error("Failed to update book", error);
        setErrorMessage("No se pudo guardar el libro. Intenta nuevamente.");
        return;
      }

      if (contextUpdates.length > 0) {
        try {
          await updateContextItems(contextUpdates);
          contextInitialRef.current = cloneContextFormValues(contextFormValues);
        } catch (error) {
          console.error("Failed to update context", error);
          setErrorMessage("No se pudo guardar el contexto. Intenta nuevamente.");
          return;
        }
      }

      setErrorMessage(null);
    },
    [
      book.id,
      buildContextUpdates,
      contextFormValues,
      formState.author,
      formState.synopsis,
      formState.title,
      updateContextItems,
      upsertBook,
    ],
  );

  const openDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(true);
    setDeleteConfirmation("");
    setDeleteErrorMessage(null);
  }, []);

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
        onClose();
      } catch (error) {
        console.error("Failed to delete book", error);
        setDeleteErrorMessage(
          "No se pudo eliminar el libro. Intenta nuevamente.",
        );
      }
    },
    [book.id, book.title, deleteBook, deleteConfirmation, onClose],
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
    deleteDialogOpen,
    deleteConfirmation,
    deleteErrorMessage,
    isDeleting,
    handleFieldChange,
    handleContextFieldChange,
    handleSubmit,
    reloadContext,
    openDeleteDialog,
    closeDeleteDialog,
    handleDeleteConfirmationChange,
    handleConfirmDelete,
  };
}
