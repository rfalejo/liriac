import { useEffect, useState } from "react";
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
import { useUpsertBook } from "../hooks/useUpsertBook";

const emptyFormState = {
	title: "",
	author: "",
	synopsis: "",
};

type BookDialogProps = {
	open: boolean;
	onClose: () => void;
	onSelectBook: (bookId: string) => void;
};

export function BookDialog({ open, onClose, onSelectBook }: BookDialogProps) {
	const { mutateAsync: upsertBook, isPending: isSaving } = useUpsertBook();
	const [formState, setFormState] = useState(emptyFormState);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		if (!open) {
			return;
		}
		setFormState(emptyFormState);
		setErrorMessage(null);
	}, [open]);

	function handleClose() {
		if (isSaving) {
			return;
		}
		onClose();
	}

	function handleFieldChange<T extends keyof typeof formState>(
		field: T,
		value: string,
	) {
		setFormState((current) => ({ ...current, [field]: value }));
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const trimmedTitle = formState.title.trim();

		if (!trimmedTitle) {
			setErrorMessage("El título es obligatorio.");
			return;
		}

		setErrorMessage(null);

		try {
			const result = await upsertBook({
				mode: "create",
				payload: {
					title: trimmedTitle,
					author: formState.author.trim(),
					synopsis: formState.synopsis.trim(),
				},
			});

			onSelectBook(result.id);
			onClose();
		} catch (error) {
			console.error("Failed to create book", error);
			setErrorMessage("No se pudo crear el libro. Intenta nuevamente.");
		}
	}

	return (
		<Dialog
			open={open}
			onClose={handleClose}
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
				<DialogTitle>Nuevo libro</DialogTitle>
				<DialogContent dividers>
					<Stack spacing={2} mt={1}>
						{errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
						<TextField
							label="Título"
							value={formState.title}
							onChange={(event) => handleFieldChange("title", event.target.value)}
							required
							autoFocus
							disabled={isSaving}
						/>
						<TextField
							label="Autor"
							value={formState.author}
							onChange={(event) => handleFieldChange("author", event.target.value)}
							disabled={isSaving}
						/>
						<TextField
							label="Sinopsis"
							value={formState.synopsis}
							onChange={(event) =>
								handleFieldChange("synopsis", event.target.value)
							}
							multiline
							minRows={3}
							disabled={isSaving}
						/>
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
					<span />
					<Stack direction="row" spacing={1}>
						<Button onClick={handleClose} disabled={isSaving}>
							Cancelar
						</Button>
						<Button type="submit" variant="contained" disabled={isSaving}>
							Crear
						</Button>
					</Stack>
				</DialogActions>
			</form>
		</Dialog>
	);
}

