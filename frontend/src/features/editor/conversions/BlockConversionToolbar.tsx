import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";

export type BlockConversionToolbarProps = {
  onOpen: () => void;
  disabled?: boolean;
};

export function BlockConversionToolbar({
  onOpen,
  disabled = false,
}: BlockConversionToolbarProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      alignItems={{ xs: "stretch", sm: "center" }}
      justifyContent="space-between"
    >
      <Typography variant="subtitle2" sx={{ letterSpacing: "0.08em" }}>
        Convertir texto en bloques
      </Typography>
      <Button
        type="button"
        variant="contained"
        startIcon={<AutoStoriesRoundedIcon />}
        onClick={onOpen}
        disabled={disabled}
      >
        Abrir conversor
      </Button>
    </Stack>
  );
}
