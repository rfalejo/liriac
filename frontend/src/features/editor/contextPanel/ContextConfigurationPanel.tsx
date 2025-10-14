import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import { useMemo, useState } from "react";
import type { ContextItem, ContextSection } from "../../../api/library";
import { getItemPrimaryText } from "../../library/components/bookContextHelpers";
import {
  useChapterContextVisibility,
  useUpdateChapterContextVisibility,
} from "../hooks/useChapterContextVisibility";

const panelContainerSx = (theme: Theme) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.92),
  borderRadius: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
  padding: theme.spacing(3),
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2.5),
  minHeight: 200,
});

const sectionContainerSx = (theme: Theme) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.75),
});

const itemRowSx = (theme: Theme) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.25, 1.5),
  borderRadius: theme.spacing(1.25),
  border: `1px solid ${alpha(theme.palette.text.primary, 0.06)}`,
  backgroundColor: alpha(theme.palette.background.default, 0.85),
});

const itemDetailsSx = {
  flex: 1,
  minWidth: 0,
};

const switchContainerSx = {
  flexShrink: 0,
};

type ContextConfigurationPanelProps = {
  chapterId: string | null;
  bookTitle: string | null;
};

type SectionWithItems = {
  section: ContextSection;
  items: ContextItem[];
};

export function ContextConfigurationPanel({
  chapterId,
  bookTitle,
}: ContextConfigurationPanelProps) {
  const [pendingKeys, setPendingKeys] = useState<Record<string, boolean>>({});
  const [mutationError, setMutationError] = useState<string | null>(null);

  const visibilityQuery = useChapterContextVisibility(chapterId);
  const updateVisibility = useUpdateChapterContextVisibility(chapterId);

  const sectionsWithItems: SectionWithItems[] = useMemo(() => {
    if (!visibilityQuery.data?.sections) {
      return [];
    }

    return visibilityQuery.data.sections
      .map((section) => {
        const eligibleItems = (section.items ?? []).filter((item) =>
          typeof item.visibleForChapter === "boolean",
        );
        return { section, items: eligibleItems } satisfies SectionWithItems;
      })
      .filter((entry) => entry.items.length > 0);
  }, [visibilityQuery.data?.sections]);

  const handleToggle = (sectionSlug: string, itemId: string, nextVisible: boolean) => {
    if (!chapterId) {
      return;
    }

    const key = `${sectionSlug}:${itemId}`;
    setPendingKeys((prev) => ({ ...prev, [key]: true }));
    setMutationError(null);

    updateVisibility.mutate(
      {
        items: [
          {
            id: itemId,
            sectionSlug,
            visible: nextVisible,
          },
        ],
      },
      {
        onError: () => {
          setMutationError("No pudimos actualizar la visibilidad. Inténtalo de nuevo.");
        },
        onSettled: () => {
          setPendingKeys((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        },
      },
    );
  };

  const isLoading = visibilityQuery.isPending;
  const isError = visibilityQuery.isError;
  const hasSections = sectionsWithItems.length > 0;
  const showSelectionMessage = !chapterId;

  return (
    <Box sx={panelContainerSx} component="aside" aria-label="Configuración de contexto">
      <Stack spacing={0.5}>
        <Typography variant="h6" component="h2" fontWeight={600}>
          Configuración de contexto
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Elige qué elementos del universo se enviarán a las solicitudes de IA para este capítulo.
        </Typography>
        {bookTitle ? (
          <Typography variant="caption" color="text.secondary">
            Libro: {bookTitle}
          </Typography>
        ) : null}
      </Stack>

      {showSelectionMessage ? (
        <Typography variant="body2" color="text.secondary">
          Selecciona un capítulo para configurar el contexto.
        </Typography>
      ) : null}

      {!showSelectionMessage && mutationError ? (
        <Alert severity="error" variant="outlined">
          {mutationError}
        </Alert>
      ) : null}

      {!showSelectionMessage && isLoading ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={1.5}
          sx={{ py: 4 }}
        >
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Cargando elementos del contexto…
          </Typography>
        </Stack>
      ) : null}

      {!showSelectionMessage && !isLoading && isError ? (
        <Stack spacing={1.5} alignItems="flex-start">
          <Typography variant="body2" color="text.secondary">
            No pudimos obtener los elementos del contexto.
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              setMutationError(null);
              void visibilityQuery.refetch();
            }}
            disabled={visibilityQuery.isFetching}
          >
            Reintentar
          </Button>
        </Stack>
      ) : null}

      {!showSelectionMessage && !isLoading && !isError && !hasSections ? (
        <Typography variant="body2" color="text.secondary">
          Este libro aún no tiene elementos de contexto disponibles.
        </Typography>
      ) : null}

      {!showSelectionMessage && !isLoading && !isError && hasSections ? (
        <Stack spacing={2.5}>
          {sectionsWithItems.map(({ section, items }, index) => (
            <Stack key={section.id} spacing={1.75} sx={sectionContainerSx}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {section.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {items.length} {items.length === 1 ? "elemento" : "elementos"}
                </Typography>
              </Box>
              <Stack spacing={1.25}>
                {items.map((item) => {
                  const visible = Boolean(item.visibleForChapter);
                  const key = `${section.id}:${item.id}`;
                  const toggling = Boolean(pendingKeys[key] || updateVisibility.isPending);
                  const label = getItemPrimaryText(item);
                  const description = item.summary || item.role || item.description || item.facts;

                  return (
                    <Box key={item.id} sx={itemRowSx}>
                      <Box sx={itemDetailsSx}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color={visible ? "text.primary" : "text.secondary"}
                        >
                          {label || item.title || item.id}
                        </Typography>
                        {description ? (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mt: 0.5 }}
                          >
                            {description}
                          </Typography>
                        ) : null}
                      </Box>
                      <Box sx={switchContainerSx}>
                        <Switch
                          checked={visible}
                          onChange={() => {
                            handleToggle(section.id, item.id, !visible);
                          }}
                          disabled={toggling}
                          slotProps={{
                            input: {
                              "aria-label": visible
                                ? `Ocultar ${label || item.title || item.id}`
                                : `Mostrar ${label || item.title || item.id}`,
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
              {index < sectionsWithItems.length - 1 ? <Divider flexItem /> : null}
            </Stack>
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}
