import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  ContextSection,
  ContextItem,
} from "../../../api/library";
import {
  CONTEXT_FIELDS_BY_SECTION,
  CONTEXT_SECTION_IDS_IN_ORDER,
  type ContextSectionId,
  getItemPrimaryText,
  makeContextKey,
  type ContextEditableField,
  type ContextItemFormValue,
} from "./bookContextHelpers";

type BookEditorContextTabProps = {
  loading: boolean;
  error: Error | null;
  sections: ContextSection[];
  contextValues: Record<string, ContextItemFormValue>;
  onFieldChange: (
    sectionSlug: ContextSection["id"],
    itemId: ContextItem["id"],
    chapterId: string | null,
    type: ContextItemFormValue["type"],
    field: ContextEditableField,
    value: string,
  ) => void;
  onAddItem: (sectionId: ContextSectionId) => void;
  onRequestDeleteItem: (details: {
    sectionSlug: ContextSection["id"];
    itemId: ContextItem["id"];
    chapterId: string | null;
    label: string;
  }) => void;
  onRetry: () => void;
  disabled: boolean;
  creatingSectionId: ContextSectionId | null;
  creatingItem: boolean;
  deletingItemKeys: Record<string, boolean>;
};

export function BookEditorContextTab({
  loading,
  error,
  sections,
  contextValues,
  onFieldChange,
  onAddItem,
  onRequestDeleteItem,
  onRetry,
  disabled,
  creatingSectionId,
  creatingItem,
  deletingItemKeys,
}: BookEditorContextTabProps) {
  const hasSections = sections.length > 0;
  const [expandedSection, setExpandedSection] = useState<ContextSectionId | null>(null);

  const orderedSections = useMemo(
    () =>
      sections
        .map((section) => {
          const sectionId = CONTEXT_SECTION_IDS_IN_ORDER.find((id) => id === section.id);
          return sectionId ? { section, sectionId } : null;
        })
        .filter((entry): entry is { section: ContextSection; sectionId: ContextSectionId } => Boolean(entry)),
    [sections],
  );

  useEffect(() => {
    if (creatingSectionId) {
      setExpandedSection(creatingSectionId);
    }
  }, [creatingSectionId]);

  let content: ReactNode;

  if (loading) {
    content = (
      <Stack
        spacing={1.5}
        alignItems="center"
        justifyContent="center"
        sx={{ py: 3 }}
      >
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Cargando contexto
        </Typography>
      </Stack>
    );
  } else if (error) {
    content = (
      <Stack spacing={1.5} alignItems="flex-start">
        <Typography variant="body2" color="text.secondary">
          No se pudo obtener el contexto.
        </Typography>
        <Button
          size="small"
          variant="contained"
          onClick={onRetry}
          disabled={disabled}
        >
          Reintentar
        </Button>
      </Stack>
    );
  } else if (!hasSections) {
    content = (
      <Typography variant="body2" color="text.secondary">
        Aún no hay elementos de contexto.
      </Typography>
    );
  } else {
    content = (
      <Stack spacing={2.5}>
        {orderedSections.map(({ section, sectionId }) => {
          const descriptors = CONTEXT_FIELDS_BY_SECTION[sectionId];
          if (!descriptors?.length) {
            return null;
          }

          const isExpanded = expandedSection === sectionId;

          const totalItems = section.items.length;
          const secondaryLabel = totalItems === 0
            ? "Sin elementos"
            : `${totalItems} ${totalItems === 1 ? "elemento" : "elementos"}`;

          return (
            <Accordion
              key={section.id}
              expanded={isExpanded}
              onChange={(_, newExpanded) => {
                setExpandedSection(newExpanded ? sectionId : null);
              }}
              disableGutters
              square={false}
              sx={(theme) => ({
                borderRadius: theme.spacing(1.5),
                border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                backgroundColor: alpha(theme.palette.background.paper, 0.7),
                "&:before": { display: "none" },
              })}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreRoundedIcon fontSize="small" />}
                sx={{
                  minHeight: 44,
                  "& .MuiAccordionSummary-content": {
                    margin: 0,
                  },
                }}
              >
                <Stack direction="row" justifyContent="space-between" width="100%" alignItems="center">
                  <Typography variant="subtitle2" fontWeight={600}>
                    {section.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {secondaryLabel}
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2.5}>
                  {section.items.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No hay elementos registrados.
                    </Typography>
                  ) : (
                    <Stack spacing={2}>
                      {section.items.map((item) => {
                        const key = makeContextKey(
                          section.id,
                          item.id,
                          item.chapterId ?? null,
                        );
                        const formValue = contextValues[key];
                        const itemLabel = getItemPrimaryText(item);
                        const deleting = Boolean(deletingItemKeys[key]);

                        return (
                          <Stack
                            key={item.id}
                            spacing={1.25}
                            sx={(theme) => ({
                              borderRadius: theme.spacing(1.25),
                              border: `1px solid ${alpha(theme.palette.text.primary, 0.06)}`,
                              backgroundColor: alpha(theme.palette.background.default, 0.85),
                              p: 1.75,
                            })}
                          >
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              spacing={1}
                            >
                              <Typography variant="body2" fontWeight={600}>
                                {itemLabel}
                              </Typography>
                              <IconButton
                                aria-label="Eliminar elemento de contexto"
                                size="small"
                                onClick={() => {
                                  if (disabled || deleting) {
                                    return;
                                  }
                                  onRequestDeleteItem({
                                    sectionSlug: section.id,
                                    itemId: item.id,
                                    chapterId: item.chapterId ?? null,
                                    label: itemLabel,
                                  });
                                }}
                                disabled={disabled || deleting}
                                sx={(theme) => ({
                                  color:
                                    disabled || deleting
                                      ? theme.palette.action.disabled
                                      : theme.palette.text.secondary,
                                  opacity: disabled || deleting ? 0.6 : 0.9,
                                  alignSelf: "flex-start",
                                  "&:hover": {
                                    opacity: 1,
                                    color: theme.palette.text.primary,
                                    backgroundColor: alpha(theme.palette.text.secondary, 0.12),
                                  },
                                })}
                              >
                                {deleting ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <DeleteRoundedIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Stack>
                            <Stack spacing={1.25}>
                              {descriptors.map((descriptor) => (
                                <TextField
                                  key={`${item.id}-${descriptor.field}`}
                                  label={descriptor.label}
                                  value={formValue?.[descriptor.field] ?? ""}
                                  onChange={(event) =>
                                    onFieldChange(
                                      section.id,
                                      item.id,
                                      item.chapterId ?? null,
                                      item.type,
                                      descriptor.field,
                                      event.target.value,
                                    )
                                  }
                                  multiline={descriptor.multiline}
                                  minRows={descriptor.minRows}
                                  disabled={disabled}
                                />
                              ))}
                            </Stack>
                          </Stack>
                        );
                      })}
                    </Stack>
                  )}
                  <Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        onAddItem(sectionId);
                      }}
                      disabled={
                        disabled || creatingItem || creatingSectionId === sectionId
                      }
                      startIcon={
                        creatingSectionId === sectionId ? (
                          <CircularProgress size={16} />
                        ) : undefined
                      }
                    >
                      {creatingSectionId === sectionId ? "Agregando..." : "Agregar elemento"}
                    </Button>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary">
        Consulta y ajusta los elementos clave del universo de la historia.
      </Typography>
      {content}
    </Stack>
  );
}
