import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import type { LibraryBook } from "../../api/library";
import { LibraryListItemButton } from "./components/LibraryListItemButton";

export type LibraryChaptersDialogProps = {
  open: boolean;
  book: LibraryBook | null;
  loading: boolean;
  onClose: () => void;
  onOpenChapter: (chapterId: string) => void;
  onCreateChapter: (bookId: string) => void;
  onEditChapter: (bookId: string, chapterId: string) => void;
};

export function LibraryChaptersDialog({
  open,
  book,
  loading,
  onClose,
  onOpenChapter,
  onCreateChapter,
  onEditChapter,
}: LibraryChaptersDialogProps) {
  const showEmptyState = book && book.chapters.length === 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          elevation: 0,
          sx: (theme) => ({
            borderRadius: theme.spacing(1.5),
            backgroundColor: alpha(theme.palette.background.paper, 0.98),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
            boxShadow: `0 28px 60px ${alpha(theme.palette.common.black, 0.18)}`,
          }),
        },
      }}
    >
      <DialogTitle sx={{ pb: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography variant="overline" sx={{ letterSpacing: "0.18em" }}>
              Capítulos
            </Typography>
            <Typography variant="h6">{book?.title ?? "Selecciona un libro"}</Typography>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {book ? (
              <Button
                variant="contained"
                size="small"
                onClick={() => onCreateChapter(book.id)}
              >
                Nuevo capítulo
              </Button>
            ) : null}
            <IconButton onClick={onClose} aria-label="Cerrar" size="small">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ px: { xs: 2.5, md: 4 }, py: { xs: 3, md: 4 } }}>
        {loading ? (
          <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ py: 6 }}>
            <CircularProgress size={22} />
            <Typography variant="body2" color="text.secondary">
              Cargando capítulos
            </Typography>
          </Stack>
        ) : null}

        {!loading && !book ? (
          <Typography variant="body2" color="text.secondary">
            Selecciona un libro para ver sus capítulos.
          </Typography>
        ) : null}

        {!loading && book ? (
          <Stack spacing={3}>
            {book.synopsis ? (
              <Typography variant="body2" color="text.secondary">
                {book.synopsis}
              </Typography>
            ) : null}
            <Divider />
            {showEmptyState ? (
              <Typography variant="body2" color="text.secondary">
                Este libro todavía no tiene capítulos.
              </Typography>
            ) : (
              <List disablePadding>
                {book.chapters.map((chapter: LibraryBook["chapters"][number]) => (
                  <LibraryListItemButton
                    key={chapter.id}
                    variant="stacked"
                    onClick={() => onOpenChapter(chapter.id)}
                  >
                    <Stack
                      direction="row"
                      alignItems="flex-start"
                      justifyContent="space-between"
                      spacing={1}
                      sx={{ width: "100%" }}
                    >
                      <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {chapter.title}
                        </Typography>
                        {chapter.summary ? (
                          <Typography variant="caption" color="text.secondary">
                            {chapter.summary}
                          </Typography>
                        ) : null}
                      </Stack>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          aria-label="Editar capítulo"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditChapter(book.id, chapter.id);
                          }}
                        >
                          <EditRoundedIcon fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </LibraryListItemButton>
                ))}
              </List>
            )}
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2.5, md: 4 }, py: 2.5 }}>
        <Button onClick={onClose} color="inherit">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
