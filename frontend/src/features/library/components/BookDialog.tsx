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
} from "@mui/material";
import type { LibraryBook } from "../../../api/library";
import { useUpsertBook } from "../hooks/useUpsertBook";

const emptyFormState = {
  title: "",
  author: "",
  synopsis: "",
};

type BookDialogMode = "create" | "edit";

type BookDialogProps = {
  open: boolean;
  mode: BookDialogMode;
  book: LibraryBook | null;
  onClose: () => void;
  onSelectBook: (bookId: string) => void;
};

export function BookDialog({
  open,
  mode,
  book,
  onClose,
  onSelectBook,
}: BookDialogProps) {
  const { mutateAsync, isPending } = useUpsertBook();
  const [formState, setFormState] = useState(emptyFormState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
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
  }, [open, mode, book]);

  const dialogTitle = useMemo(
    () => (mode === "create" ? "Nuevo libro" : "Editar libro"),
    [mode],
  );

  const submitLabel = mode === "create" ? "Crear" : "Guardar";

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

    try {
      if (mode === "create") {
        const payload = {
          title: trimmedTitle,
          author: authorValue,
          synopsis: synopsisValue,
        };
        const result = await mutateAsync({ mode: "create", payload });
        onSelectBook(result.id);
      } else if (book) {
        const payload = {
          title: trimmedTitle,
          author: authorValue,
          synopsis: synopsisValue,
        };
        await mutateAsync({ mode: "update", bookId: book.id, payload });
      }
      onClose();
    } catch (error) {
      console.error("Failed to upsert book", error);
      setErrorMessage("No se pudo guardar el libro. Intenta nuevamente.");
    }
  }

  function handleFieldChange<T extends keyof typeof formState>(
    field: T,
    value: string,
  ) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

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
              label="Autor"
              value={formState.author}
              onChange={(event) =>
                handleFieldChange("author", event.target.value)
              }
            />
            <TextField
              label="Sinopsis"
              value={formState.synopsis}
              onChange={(event) =>
                handleFieldChange("synopsis", event.target.value)
              }
              multiline
              minRows={3}
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
