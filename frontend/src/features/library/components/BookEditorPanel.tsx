import { useEffect, useMemo, useRef, useState } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
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
  getItemPrimaryText,
  makeContextKey,
  type ContextEditableField,
  type ContextItemFormValue,
} from "./bookContextHelpers";
import { LibraryPanel } from "./LibraryPanel";
import { useUpsertBook } from "../hooks/useUpsertBook";
import { useDeleteBook } from "../hooks/useDeleteBook";
import { useLibrarySections } from "../hooks/useLibrarySections";
import { useUpdateLibraryContext } from "../hooks/useUpdateLibraryContext";

const emptyFormState = {
  title: "",
  author: "",
  synopsis: "",
};

type BookEditorPanelProps = {
  book: LibraryBook;
  onClose: () => void;
};

export function BookEditorPanel({ book, onClose }: BookEditorPanelProps) {
  const { mutateAsync: upsertBook, isPending: isSaving } = useUpsertBook();
  const { mutateAsync: deleteBook, isPending: isDeleting } = useDeleteBook();
  const {
    sections: rawSections,
    loading: contextLoading,
    error: contextError,
    reload: reloadContext,
  } = useLibrarySections(book.id);
  const { mutateAsync: updateContextItems, isPending: isUpdatingContext } =
    useUpdateLibraryContext(book.id);

  const [formState, setFormState] = useState(emptyFormState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [contextFormValues, setContextFormValues] = useState<
    Record<string, ContextItemFormValue>
  >({});
  const contextInitialRef = useRef<Record<string, ContextItemFormValue>>({});

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setFormState({
      title: book.title,
      author: book.author ?? "",
      synopsis: book.synopsis ?? "",
    });
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

  const isBusy = isSaving || isUpdatingContext;

  function handleFieldChange<T extends keyof typeof formState>(
    field: T,
    value: string,
  ) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function handleContextFieldChange(
    sectionSlug: string,
    itemId: string,
    chapterId: string | null,
    type: ContextItemFormValue["type"],
    field: ContextEditableField,
    value: string,
  ) {
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
  }

  function buildContextUpdates(): ContextItemUpdate[] {
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
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
  }

  function handleOpenDeleteDialog() {
    setDeleteDialogOpen(true);
    setDeleteConfirmation("");
    setDeleteErrorMessage(null);
  }

  function handleCloseDeleteDialog() {
    if (isDeleting) {
      return;
    }
    setDeleteDialogOpen(false);
    setDeleteConfirmation("");
    setDeleteErrorMessage(null);
  }

  async function handleConfirmDelete(event: React.FormEvent<HTMLFormElement>) {
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
  }

  const disableActions = isBusy || isDeleting;

  return (
    <>
      <LibraryPanel
        title="Editar libro"
        actions={
          <IconButton
            aria-label="Cerrar editor de libro"
            size="small"
            onClick={onClose}
            disabled={disableActions}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        }
        sx={{ minHeight: "100%" }}
      >
        <Stack
          component="form"
          spacing={3}
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          noValidate
        >
          <Stack spacing={0.75}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {book.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Actualiza la información del libro y su contexto creativo.
            </Typography>
          </Stack>

          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          <Stack spacing={2}>
            <TextField
              label="Título"
              value={formState.title}
              onChange={(event) => handleFieldChange("title", event.target.value)}
              required
              disabled={disableActions}
            />
            <TextField
              label="Autor"
              value={formState.author}
              onChange={(event) => handleFieldChange("author", event.target.value)}
              disabled={disableActions}
            />
            <TextField
              label="Sinopsis"
              value={formState.synopsis}
              onChange={(event) =>
                handleFieldChange("synopsis", event.target.value)
              }
              multiline
              minRows={3}
              disabled={disableActions}
            />
          </Stack>

          <Divider />

          <Stack spacing={1.5}>
            <Typography variant="subtitle2" fontWeight={600}>
              Contexto creativo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Consulta y ajusta los elementos clave del universo de la historia.
            </Typography>
          </Stack>

          {contextLoading ? (
            <Stack
              spacing={1.5}
              alignItems="center"
              justifyContent="center"
              sx={{ py: 3 }}
            >
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Cargando contexto
              </Typography>
            </Stack>
          ) : null}

          {!contextLoading && contextError ? (
            <Stack spacing={1.5} alignItems="flex-start">
              <Typography variant="body2" color="text.secondary">
                No se pudo obtener el contexto.
              </Typography>
              <Button
                size="small"
                variant="contained"
                onClick={reloadContext}
                disabled={disableActions}
              >
                Reintentar
              </Button>
            </Stack>
          ) : null}

          {!contextLoading && !contextError && contextSections.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aún no hay elementos de contexto.
            </Typography>
          ) : null}

          {!contextLoading && !contextError && contextSections.length > 0 ? (
            <Stack spacing={2.5}>
              {contextSections.map((section) => {
                const sectionId = CONTEXT_SECTION_IDS_IN_ORDER.find(
                  (id) => id === section.id,
                );
                if (!sectionId) {
                  return null;
                }

                const descriptors = CONTEXT_FIELDS_BY_SECTION[sectionId];
                if (!descriptors?.length) {
                  return null;
                }

                return (
                  <Stack key={section.id} spacing={1.5}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {section.title}
                    </Typography>
                    {section.items.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No hay elementos registrados.
                      </Typography>
                    ) : (
                      <Stack spacing={2}>
                        {section.items.map((item) => {
                          const key = makeContextKey(
                            section.id,
                            item.id,
                            item.chapterId ?? null,
                          );
                          const formValue = contextFormValues[key];
                          const itemLabel = getItemPrimaryText(item);

                          return (
                            <Stack
                              key={item.id}
                              spacing={1.25}
                              sx={{
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 1,
                                p: 1.5,
                              }}
                            >
                              <Typography variant="body2" fontWeight={600}>
                                {itemLabel}
                              </Typography>
                              <Stack spacing={1.25}>
                                {descriptors.map((descriptor) => (
                                  <TextField
                                    key={`${item.id}-${descriptor.field}`}
                                    label={descriptor.label}
                                    value={formValue?.[descriptor.field] ?? ""}
                                    onChange={(event) =>
                                      handleContextFieldChange(
                                        section.id,
                                        item.id,
                                        item.chapterId ?? null,
                                        item.type,
                                        descriptor.field,
                                        event.target.value,
                                      )
                                    }
                                    multiline={descriptor.multiline}
                                    minRows={descriptor.minRows}
                                    disabled={disableActions || contextLoading}
                                  />
                                ))}
                              </Stack>
                            </Stack>
                          );
                        })}
                      </Stack>
                    )}
                  </Stack>
                );
              })}
            </Stack>
          ) : null}

          <Divider />

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1.5}
          >
            <Button
              color="error"
              onClick={handleOpenDeleteDialog}
              disabled={disableActions}
            >
              Eliminar libro
            </Button>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Button onClick={onClose} disabled={disableActions}>
                Cerrar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={disableActions}
              >
                Guardar
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </LibraryPanel>

      <DeleteBookDialog
        open={deleteDialogOpen}
        bookTitle={book.title}
        confirmationValue={deleteConfirmation}
        errorMessage={deleteErrorMessage}
        onChangeConfirmation={(value) => {
          setDeleteConfirmation(value);
          if (deleteErrorMessage) {
            setDeleteErrorMessage(null);
          }
        }}
        onClose={handleCloseDeleteDialog}
        onSubmit={(event) => {
          void handleConfirmDelete(event);
        }}
        disabled={isDeleting}
      />
    </>
  );
}

type DeleteBookDialogProps = {
  open: boolean;
  bookTitle: string;
  confirmationValue: string;
  errorMessage: string | null;
  disabled: boolean;
  onChangeConfirmation: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

function DeleteBookDialog({
  open,
  bookTitle,
  confirmationValue,
  errorMessage,
  disabled,
  onChangeConfirmation,
  onClose,
  onSubmit,
}: DeleteBookDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle>Eliminar libro</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <DialogContentText>
              Esta acción no se puede deshacer. Escribe el título del libro para
              confirmar.
            </DialogContentText>
            <DialogContentText sx={{ fontWeight: 500 }}>
              "{bookTitle}"
            </DialogContentText>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            <TextField
              label="Título del libro"
              value={confirmationValue}
              onChange={(event) => onChangeConfirmation(event.target.value)}
              placeholder={bookTitle}
              autoFocus
              disabled={disabled}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={disabled}>
            Cancelar
          </Button>
          <Button
            type="submit"
            color="error"
            variant="contained"
            disabled={
              disabled || confirmationValue.trim() !== bookTitle.trim()
            }
          >
            Eliminar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
