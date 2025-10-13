import { useEffect, useMemo, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { ChapterSummary, LibraryBook } from "../../../api/library";
import { useUpsertChapter } from "../hooks/useUpsertChapter";

type ChapterFormState = {
  title: string;
  summary: string;
  ordinal: string;
};

const emptyFormState: ChapterFormState = {
  title: "",
  summary: "",
  ordinal: "",
};

const CREATE_CHAPTER_PLACEHOLDER_ID = "__create__";

function areChapterFormStatesEqual(a: ChapterFormState, b: ChapterFormState) {
  return a.title === b.title && a.summary === b.summary && a.ordinal === b.ordinal;
}

function buildDialogKey(mode: ChapterDialogMode, bookId: string | null, chapterId: string | null) {
  return `${mode}:${bookId ?? "none"}:${chapterId ?? CREATE_CHAPTER_PLACEHOLDER_ID}`;
}

type ChapterDialogMode = "create" | "edit";

type ChapterDialogProps = {
  open: boolean;
  mode: ChapterDialogMode;
  book: LibraryBook | null;
  chapter: ChapterSummary | null;
  onClose: () => void;
  onSelectBook: (bookId: string) => void;
};

export function ChapterDialog({
  open,
  mode,
  book,
  chapter,
  onClose,
  onSelectBook,
}: ChapterDialogProps) {
  const { mutateAsync, isPending } = useUpsertChapter();
  const [formState, setFormState] = useState<ChapterFormState>(emptyFormState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const initialRef = useRef<ChapterFormState>(emptyFormState);
  const lastLoadedRef = useRef<{
    key: string;
    snapshot: ChapterFormState;
  } | null>(null);

  const dialogKey = buildDialogKey(mode, book?.id ?? null, chapter?.id ?? null);

  const formHasChanges = useMemo(() => {
    const initial = initialRef.current;
    return (
      formState.title !== initial.title ||
      formState.summary !== initial.summary ||
      formState.ordinal !== initial.ordinal
    );
  }, [formState]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextState: ChapterFormState = mode === "edit" && chapter
      ? {
          title: chapter.title,
          summary: chapter.summary ?? "",
          ordinal: String(chapter.ordinal),
        }
      : {
          title: "",
          summary: "",
          ordinal: String((book?.chapters.length ?? 0) + 1),
        };

    const lastLoaded = lastLoadedRef.current;
    if (lastLoaded?.key === dialogKey) {
      if (formHasChanges || areChapterFormStatesEqual(lastLoaded.snapshot, nextState)) {
        return;
      }
    }

    setFormState(nextState);
    initialRef.current = nextState;
    lastLoadedRef.current = { key: dialogKey, snapshot: nextState };
    setErrorMessage(null);
  }, [
    open,
    mode,
    book?.chapters.length,
    dialogKey,
    chapter?.id,
    chapter?.ordinal,
    chapter?.summary,
    chapter?.title,
    formHasChanges,
  ]);

  const dialogTitle = useMemo(() => {
    if (mode === "create") {
      return "Nuevo capítulo";
    }
    return "Editar capítulo";
  }, [mode]);

  const submitLabel = mode === "create" ? "Crear" : "Guardar";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = formState.title.trim();

    if (!trimmedTitle) {
      setErrorMessage("El título es obligatorio.");
      return;
    }

    const ordinalValue = Number(formState.ordinal);
    if (!Number.isFinite(ordinalValue) || ordinalValue < 0) {
      setErrorMessage("El orden debe ser un número positivo.");
      return;
    }

    const normalizedOrdinal = Math.max(0, Math.trunc(ordinalValue));

    setErrorMessage(null);

    if (!book) {
      setErrorMessage("Selecciona un libro para continuar.");
      return;
    }

    const summaryValue = formState.summary.trim();

    const savedState: ChapterFormState = {
      title: trimmedTitle,
      summary: summaryValue,
      ordinal: String(normalizedOrdinal),
    };

    try {
      if (mode === "create") {
        await mutateAsync({
          mode: "create",
          bookId: book.id,
          payload: {
            title: trimmedTitle,
            summary: summaryValue,
            ordinal: normalizedOrdinal,
          },
        });
      } else if (chapter) {
        await mutateAsync({
          mode: "update",
          bookId: book.id,
          chapterId: chapter.id,
          payload: {
            title: trimmedTitle,
            summary: summaryValue,
            ordinal: normalizedOrdinal,
          },
        });
      }

      initialRef.current = savedState;
      lastLoadedRef.current = { key: dialogKey, snapshot: savedState };
      setFormState(savedState);
      onSelectBook(book.id);
      onClose();
    } catch (error) {
      console.error("Failed to upsert chapter", error);
      setErrorMessage("No se pudo guardar el capítulo. Intenta nuevamente.");
    }
  }

  function handleFieldChange<T extends keyof typeof formState>(
    field: T,
    value: string,
  ) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  const bookTitle = book?.title ?? "";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        noValidate
      >
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            {bookTitle && (
              <Typography variant="caption" color="text.secondary">
                Libro: {bookTitle}
              </Typography>
            )}
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            <TextField
              label="Título"
              value={formState.title}
              onChange={(event) =>
                handleFieldChange("title", event.target.value)
              }
              required
              autoFocus
            />
            <TextField
              label="Resumen"
              value={formState.summary}
              onChange={(event) =>
                handleFieldChange("summary", event.target.value)
              }
              multiline
              minRows={3}
            />
            <TextField
              label="Orden"
              type="number"
              value={formState.ordinal}
              onChange={(event) =>
                handleFieldChange("ordinal", event.target.value)
              }
              required
              slotProps={{ htmlInput: { min: 0 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
