import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
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
  onRetry: () => void;
  disabled: boolean;
  creatingSectionId: ContextSectionId | null;
  creatingItem: boolean;
};

export function BookEditorContextTab({
  loading,
  error,
  sections,
  contextValues,
  onFieldChange,
  onAddItem,
  onRetry,
  disabled,
  creatingSectionId,
  creatingItem,
}: BookEditorContextTabProps) {
  const hasSections = sections.length > 0;

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
        {sections.map((section) => {
          const sectionId = CONTEXT_SECTION_IDS_IN_ORDER.find(
            (id) => id === section.id,
          );
          if (!sectionId) {
            return null;
          }

          const descriptors = CONTEXT_FIELDS_BY_SECTION[sectionId];
          if (!descriptors?.length) {
            return null;
          }

          return (
            <Stack key={section.id} spacing={1.5}>
              <Typography variant="subtitle2" fontWeight={600}>
                {section.title}
              </Typography>
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

                    return (
                      <Stack
                        key={item.id}
                        spacing={1.25}
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          p: 1.5,
                        }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {itemLabel}
                        </Typography>
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
            </Stack>
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
