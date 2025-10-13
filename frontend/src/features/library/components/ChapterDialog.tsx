import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { ChapterSummary, LibraryBook } from "../../../api/library";
import { useUpsertChapter } from "../hooks/useUpsertChapter";

const emptyFormState = {
  title: "",
  summary: "",
  ordinal: "",
};

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
  const [formState, setFormState] = useState(emptyFormState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && chapter) {
      setFormState({
        title: chapter.title,
        summary: chapter.summary ?? "",
        ordinal: String(chapter.ordinal),
      });
    } else {
      const nextOrdinal = book ? book.chapters.length + 1 : 1;
      setFormState({
        title: "",
        summary: "",
        ordinal: String(nextOrdinal),
      });
    }
    setErrorMessage(null);
  }, [open, mode, chapter, book]);

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
              onChange={(event) => handleFieldChange("title", event.target.value)}
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
              onChange={(event) => handleFieldChange("ordinal", event.target.value)}
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
