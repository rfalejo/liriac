import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
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
  focusTab?: BookEditorTabValue;
  focusRequest?: number;
};

export function BookEditorPanel({
  book,
  onClose,
  focusTab = "metadata",
  focusRequest = 0,
}: BookEditorPanelProps) {
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
    metadataHasChanges,
    contextHasChanges,
    deleteDialogOpen,
    deleteConfirmation,
    deleteErrorMessage,
    isDeleting,
  creatingContextSection,
  isCreatingContextItem,
    handleFieldChange,
    handleContextFieldChange,
  handleAddContextItem,
    handleSubmit,
    reloadContext,
    openDeleteDialog,
    closeDeleteDialog,
    handleDeleteConfirmationChange,
    handleConfirmDelete,
  } = useBookEditorPanel({
    book,
    onClose,
    focusTab,
    focusRequest,
  });

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
              onAddItem={handleAddContextItem}
              onRetry={reloadContext}
              disabled={disableActions || contextLoading}
              creatingSectionId={creatingContextSection}
              creatingItem={isCreatingContextItem}
            />
          ) : null}

          <Divider />

          <Stack direction="row" justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              disabled={
                disableActions ||
                (activeTab === "metadata"
                  ? !metadataHasChanges
                  : !contextHasChanges)
              }
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
