import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type {
  ContextItem,
  ContextSection,
  LibraryBook,
  LibraryResponse,
  ContextItemUpdate,
} from "../../../api/library";
import { useUpsertBook } from "../hooks/useUpsertBook";
import { useDeleteBook } from "../hooks/useDeleteBook";
import { useUpdateLibraryContext } from "../hooks/useUpdateLibraryContext";

const emptyFormState = {
  title: "",
  author: "",
  synopsis: "",
};

const CONTEXT_SECTION_IDS_IN_ORDER = [
  "characters",
  "world",
  "styleTone",
] as const;

type ContextSectionId = (typeof CONTEXT_SECTION_IDS_IN_ORDER)[number];

type ContextEditableField =
  | "name"
  | "role"
  | "summary"
  | "title"
  | "description"
  | "facts";

type ContextItemFormValue = {
  id: string;
  sectionId: string;
  type: ContextItem["type"];
} & Partial<Record<ContextEditableField, string>>;

type ContextFieldDescriptor = {
  field: ContextEditableField;
  label: string;
  multiline?: boolean;
  minRows?: number;
};

const CONTEXT_FIELDS_BY_SECTION: Record<
  ContextSectionId,
  ContextFieldDescriptor[]
> = {
  characters: [
    { field: "name", label: "Nombre" },
    { field: "role", label: "Rol" },
    { field: "summary", label: "Resumen", multiline: true, minRows: 3 },
  ],
  world: [
    { field: "title", label: "Título" },
    { field: "summary", label: "Resumen", multiline: true, minRows: 3 },
    { field: "facts", label: "Datos clave", multiline: true, minRows: 2 },
  ],
  styleTone: [
    {
      field: "description",
      label: "Descripción",
      multiline: true,
      minRows: 3,
    },
  ],
};

function makeContextKey(sectionId: string, itemId: string) {
  return `${sectionId}:${itemId}`;
}

function buildContextFormValues(
  sections: ContextSection[],
): Record<string, ContextItemFormValue> {
  const result: Record<string, ContextItemFormValue> = {};

  for (const section of sections) {
    const sectionId = CONTEXT_SECTION_IDS_IN_ORDER.find(
      (id) => id === section.id,
    );
    if (!sectionId) {
      continue;
    }

    const fieldDescriptors = CONTEXT_FIELDS_BY_SECTION[sectionId];
    if (!fieldDescriptors?.length) {
      continue;
    }

    for (const item of section.items) {
      const key = makeContextKey(section.id, item.id);
      const value: ContextItemFormValue = {
        id: item.id,
        sectionId: section.id,
        type: item.type,
      };

      for (const descriptor of fieldDescriptors) {
        const raw = item[descriptor.field as keyof ContextItem];
        const normalized =
          typeof raw === "string"
            ? raw
            : raw === null || raw === undefined
              ? ""
              : String(raw);
        value[descriptor.field] = normalized;
      }

      result[key] = value;
    }
  }

  return result;
}

function cloneContextFormValues(
  values: Record<string, ContextItemFormValue>,
): Record<string, ContextItemFormValue> {
  const clone: Record<string, ContextItemFormValue> = {};
  for (const [key, entry] of Object.entries(values)) {
    clone[key] = { ...entry };
  }
  return clone;
}

function getItemPrimaryText(item: ContextItem) {
  return item.title ?? item.name ?? "Sin título";
}

type BookDialogMode = "create" | "edit";

type BookDialogProps = {
  open: boolean;
  mode: BookDialogMode;
  book: LibraryBook | null;
  onClose: () => void;
  onSelectBook: (bookId: string) => void;
  sections: LibraryResponse["sections"];
  sectionsLoading: boolean;
  sectionsError: Error | null;
  onReloadSections: () => void;
};

export function BookDialog({
  open,
  mode,
  book,
  onClose,
  onSelectBook,
  sections,
  sectionsLoading,
  sectionsError,
  onReloadSections,
}: BookDialogProps) {
  const { mutateAsync: upsertBook, isPending: isSaving } = useUpsertBook();
  const { mutateAsync: deleteBook, isPending: isDeleting } = useDeleteBook();
  const { mutateAsync: updateContextItems, isPending: isUpdatingContext } =
    useUpdateLibraryContext();
  const [formState, setFormState] = useState(emptyFormState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null,
  );
  const [contextFormValues, setContextFormValues] = useState<
    Record<string, ContextItemFormValue>
  >({});
  const contextInitialRef = useRef<Record<string, ContextItemFormValue>>({});

  useEffect(() => {
    if (!open) {
      setDeleteDialogOpen(false);
      setDeleteConfirmation("");
      setDeleteErrorMessage(null);
      return;
    }

    if (mode === "edit" && book) {
      setFormState({
        title: book.title,
        author: book.author ?? "",
        synopsis: book.synopsis ?? "",
      });
    } else {
      setFormState(emptyFormState);
    }
    setErrorMessage(null);
    setDeleteDialogOpen(false);
    setDeleteConfirmation("");
    setDeleteErrorMessage(null);
  }, [open, mode, book]);

  const dialogTitle = useMemo(
    () => (mode === "create" ? "Nuevo libro" : "Editar libro"),
    [mode],
  );

  const submitLabel = mode === "create" ? "Crear" : "Guardar";
  const isBusy = isSaving || isDeleting || isUpdatingContext;

  const contextSections = useMemo(() => {
    const sectionsById = new Map<string, ContextSection>();
    for (const section of sections) {
      sectionsById.set(section.id, section);
    }
    return CONTEXT_SECTION_IDS_IN_ORDER.map((sectionId) =>
      sectionsById.get(sectionId),
    ).filter((section): section is ContextSection => Boolean(section));
  }, [sections]);

  useEffect(() => {
    if (!open || mode !== "edit") {
      setContextFormValues({});
      contextInitialRef.current = {};
      return;
    }

    const nextValues = buildContextFormValues(contextSections);
    setContextFormValues(nextValues);
    contextInitialRef.current = cloneContextFormValues(nextValues);
  }, [open, mode, contextSections]);

  const showContextArea = mode === "edit";

  function handleDialogClose() {
    if (isBusy) {
      return;
    }
    onClose();
  }

  function handleContextFieldChange(
    sectionId: string,
    itemId: string,
    type: ContextItem["type"],
    field: ContextEditableField,
    value: string,
  ) {
    const key = makeContextKey(sectionId, itemId);

    setContextFormValues((current) => {
      const existing = current[key] ?? {
        id: itemId,
        sectionId,
        type,
      };

      return {
        ...current,
        [key]: {
          ...existing,
          type: existing.type ?? type,
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
        const key = makeContextKey(section.id, item.id);
        const current = contextFormValues[key];
        const initial = contextInitialRef.current[key];

        if (!current || !initial) {
          continue;
        }

        const payload: Partial<ContextItemUpdate> = {
          id: current.id,
          sectionId: current.sectionId,
        };
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

    const authorValue = formState.author.trim();
    const synopsisValue = formState.synopsis.trim();
    const contextUpdates = mode === "edit" ? buildContextUpdates() : [];

    try {
      if (mode === "create") {
        const payload = {
          title: trimmedTitle,
          author: authorValue,
          synopsis: synopsisValue,
        };
        const result = await upsertBook({ mode: "create", payload });
        onSelectBook(result.id);
      } else if (book) {
        const payload = {
          title: trimmedTitle,
          author: authorValue,
          synopsis: synopsisValue,
        };
        await upsertBook({ mode: "update", bookId: book.id, payload });
      }
    } catch (error) {
      console.error("Failed to upsert book", error);
      setErrorMessage("No se pudo guardar el libro. Intenta nuevamente.");
      return;
    }

    if (contextUpdates.length > 0) {
      try {
        await updateContextItems(contextUpdates);
        contextInitialRef.current = cloneContextFormValues(contextFormValues);
      } catch (error) {
        console.error("Failed to update context items", error);
        setErrorMessage("No se pudo guardar el contexto. Intenta nuevamente.");
        return;
      }
    }

    onClose();
  }

  function handleFieldChange<T extends keyof typeof formState>(
    field: T,
    value: string,
  ) {
    setFormState((current) => ({ ...current, [field]: value }));
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

    if (!book) {
      return;
    }

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

  return (
    <>
      <Dialog
        open={open}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: (theme) => ({
              borderRadius: theme.spacing(1.5),
            }),
          },
        }}
      >
        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          noValidate
        >
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} mt={1}>
              {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
              <TextField
                label="Título"
                value={formState.title}
                onChange={(event) =>
                  handleFieldChange("title", event.target.value)
                }
                required
                autoFocus
                disabled={isBusy}
              />
              <TextField
                label="Autor"
                value={formState.author}
                onChange={(event) =>
                  handleFieldChange("author", event.target.value)
                }
                disabled={isBusy}
              />
              <TextField
                label="Sinopsis"
                value={formState.synopsis}
                onChange={(event) =>
                  handleFieldChange("synopsis", event.target.value)
                }
                multiline
                minRows={3}
                disabled={isBusy}
              />
              {showContextArea ? (
                <Stack spacing={2} sx={{ pt: 1 }}>
                  <Divider />
                  <Stack spacing={1}>
                    <Typography variant="overline" sx={{ letterSpacing: 0.8 }}>
                      Contexto creativo
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Consulta los elementos clave del universo de la historia.
                    </Typography>
                  </Stack>
                  {sectionsLoading ? (
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
                  {!sectionsLoading && sectionsError ? (
                    <Stack spacing={1.5} alignItems="flex-start">
                      <Typography variant="body2" color="text.secondary">
                        No se pudo obtener el contexto.
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={onReloadSections}
                      >
                        Reintentar
                      </Button>
                    </Stack>
                  ) : null}
                  {!sectionsLoading &&
                  !sectionsError &&
                  contextSections.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Aún no hay elementos de contexto.
                    </Typography>
                  ) : null}
                  {!sectionsLoading &&
                  !sectionsError &&
                  contextSections.length > 0 ? (
                    <Stack spacing={2.5}>
                      {contextSections.map((section) => {
                        const sectionId = CONTEXT_SECTION_IDS_IN_ORDER.find(
                          (id) => id === section.id,
                        );
                        if (!sectionId) {
                          return null;
                        }

                        const fieldDescriptors =
                          CONTEXT_FIELDS_BY_SECTION[sectionId];
                        if (!fieldDescriptors?.length) {
                          return null;
                        }

                        return (
                          <Stack key={section.id} spacing={1.5}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {section.title}
                            </Typography>
                            {section.items.length === 0 ? (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                No hay elementos registrados.
                              </Typography>
                            ) : (
                              <Stack spacing={2}>
                                {section.items.map((item) => {
                                  const key = makeContextKey(
                                    section.id,
                                    item.id,
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
                                      <Typography
                                        variant="body2"
                                        fontWeight={600}
                                      >
                                        {itemLabel}
                                      </Typography>
                                      <Stack spacing={1.25}>
                                        {fieldDescriptors.map((descriptor) => (
                                          <TextField
                                            key={`${item.id}-${descriptor.field}`}
                                            label={descriptor.label}
                                            value={
                                              formValue?.[descriptor.field] ??
                                              ""
                                            }
                                            onChange={(event) =>
                                              handleContextFieldChange(
                                                section.id,
                                                item.id,
                                                item.type,
                                                descriptor.field,
                                                event.target.value,
                                              )
                                            }
                                            multiline={descriptor.multiline}
                                            minRows={descriptor.minRows}
                                            disabled={isBusy || sectionsLoading}
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
                </Stack>
              ) : null}
            </Stack>
          </DialogContent>
          <DialogActions
            sx={{
              px: 3,
              py: 2,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {mode === "edit" && book ? (
              <Button
                color="error"
                onClick={handleOpenDeleteDialog}
                disabled={isBusy}
              >
                Eliminar libro
              </Button>
            ) : (
              <span />
            )}
            <Stack direction="row" spacing={1}>
              <Button onClick={handleDialogClose} disabled={isBusy}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" disabled={isBusy}>
                {submitLabel}
              </Button>
            </Stack>
          </DialogActions>
        </form>
      </Dialog>

      {mode === "edit" && book ? (
        <Dialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          fullWidth
          maxWidth="xs"
        >
          <form
            onSubmit={(event) => {
              void handleConfirmDelete(event);
            }}
            noValidate
          >
            <DialogTitle>Eliminar libro</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2} mt={1}>
                <DialogContentText>
                  Esta acción no se puede deshacer. Escribe el título del libro
                  para confirmar.
                </DialogContentText>
                <DialogContentText sx={{ fontWeight: 500 }}>
                  "{book.title}"
                </DialogContentText>
                {deleteErrorMessage && (
                  <Alert severity="error">{deleteErrorMessage}</Alert>
                )}
                <TextField
                  label="Título del libro"
                  value={deleteConfirmation}
                  onChange={(event) => {
                    setDeleteConfirmation(event.target.value);
                    if (deleteErrorMessage) {
                      setDeleteErrorMessage(null);
                    }
                  }}
                  placeholder={book.title}
                  autoFocus
                  disabled={isDeleting}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDeleteDialog} disabled={isDeleting}>
                Cancelar
              </Button>
              <Button
                type="submit"
                color="error"
                variant="contained"
                disabled={
                  isDeleting || deleteConfirmation.trim() !== book.title.trim()
                }
              >
                Eliminar
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      ) : null}
    </>
  );
}
