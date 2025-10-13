import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import {
  Alert,
  Button,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import type { LibraryBook } from "../../../api/library";
import { LibraryPanel } from "./LibraryPanel";
import { BookDeleteDialog } from "./BookDeleteDialog";
import { BookEditorContextTab } from "./BookEditorContextTab";
import { BookEditorMetadataTab } from "./BookEditorMetadataTab";
import {
  useBookEditorPanel,
  type BookEditorTabValue,
} from "../hooks/useBookEditorPanel";

type BookEditorPanelProps = {
  book: LibraryBook;
  onClose: () => void;
};

export function BookEditorPanel({ book, onClose }: BookEditorPanelProps) {
  const {
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
  } = useBookEditorPanel({ book, onClose });

  return (
    <>
      <LibraryPanel
        title="Editar libro"
        actions={
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton
              aria-label="Eliminar libro"
              size="small"
              onClick={openDeleteDialog}
              disabled={disableActions}
              sx={(theme) => ({
                color: disableActions
                  ? theme.palette.error.light
                  : theme.palette.error.main,
                opacity: disableActions ? 0.5 : 0.7,
                "&:hover": {
                  opacity: 1,
                  color: theme.palette.error.main,
                  backgroundColor: theme.palette.error.main + "11",
                },
              })}
            >
              <DeleteRoundedIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="Cerrar editor de libro"
              size="small"
              onClick={onClose}
              disabled={disableActions}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
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

          <Tabs
            value={activeTab}
            onChange={(_, value) => {
              handleTabChange(value as BookEditorTabValue);
            }}
            aria-label="Editor de libro"
            sx={(theme) => ({
              borderRadius: theme.spacing(1),
              bgcolor: theme.palette.background.default,
              px: 1,
              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius: theme.spacing(1),
              },
            })}
          >
            <Tab
              value="metadata"
              label="Información general"
              sx={{ alignSelf: "center" }}
            />
            <Tab value="context" label="Contexto creativo" />
          </Tabs>

          {activeTab === "metadata" ? (
            <BookEditorMetadataTab
              formState={formState}
              onFieldChange={handleFieldChange}
              disabled={disableActions}
            />
          ) : null}

          {activeTab === "context" ? (
            <BookEditorContextTab
              loading={contextLoading}
              error={contextError}
              sections={contextSections}
              contextValues={contextFormValues}
              onFieldChange={handleContextFieldChange}
              onRetry={reloadContext}
              disabled={disableActions || contextLoading}
            />
          ) : null}

          <Divider />

          <Stack direction="row" justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              disabled={disableActions}
            >
              Guardar
            </Button>
          </Stack>
        </Stack>
      </LibraryPanel>

      <BookDeleteDialog
        open={deleteDialogOpen}
        bookTitle={book.title}
        confirmationValue={deleteConfirmation}
        errorMessage={deleteErrorMessage}
        onChangeConfirmation={handleDeleteConfirmationChange}
        onClose={closeDeleteDialog}
        onSubmit={(event) => {
          void handleConfirmDelete(event);
        }}
        disabled={isDeleting}
      />
    </>
  );
}
