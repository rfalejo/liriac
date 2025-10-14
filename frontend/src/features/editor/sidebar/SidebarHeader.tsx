import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";

export type SidebarHeaderProps = {
  bookTitle: string | null;
  onClose: () => void;
  hideTitle?: boolean;
};

export function SidebarHeader({
  bookTitle,
  onClose,
  hideTitle = false,
}: SidebarHeaderProps) {
  return (
    <>
      {hideTitle ? null : (
        <Typography
          id="editor-container-heading"
          variant="subtitle2"
          sx={(theme: Theme) => ({
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: theme.palette.editor.sidebarHeading,
          })}
        >
          {bookTitle ?? "Capítulos"}
        </Typography>
      )}
      <Button
        variant="text"
        color="inherit"
        onClick={onClose}
        sx={(theme: Theme) => ({
          alignSelf: "flex-start",
          color: theme.palette.editor.sidebarButton,
          px: 0,
          "&:hover": {
            color: theme.palette.editor.sidebarButtonHover,
            backgroundColor: "transparent",
          },
        })}
      >
        Regresar a la librería
      </Button>
    </>
  );
}
