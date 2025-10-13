import type { ContextItem, ContextSection } from "../../../api/library";

export const CONTEXT_SECTION_IDS_IN_ORDER = [
  "characters",
  "world",
  "styleTone",
] as const;

export type ContextSectionId = (typeof CONTEXT_SECTION_IDS_IN_ORDER)[number];

export type ContextEditableField =
  | "name"
  | "role"
  | "summary"
  | "title"
  | "description"
  | "facts";

export type ContextItemFormValue = {
  id: string;
  sectionSlug: string;
  chapterId: string | null;
  type: ContextItem["type"];
} & Partial<Record<ContextEditableField, string>>;

export type ContextFieldDescriptor = {
  field: ContextEditableField;
  label: string;
  multiline?: boolean;
  minRows?: number;
};

export const CONTEXT_FIELDS_BY_SECTION: Record<
  ContextSectionId,
  ContextFieldDescriptor[]
> = {
  characters: [
    { field: "name", label: "Nombre" },
    { field: "role", label: "Rol" },
    { field: "summary", label: "Resumen", multiline: true, minRows: 3 },
  ],
  world: [
    { field: "title", label: "Título" },
    { field: "summary", label: "Resumen", multiline: true, minRows: 3 },
    { field: "facts", label: "Datos clave", multiline: true, minRows: 2 },
  ],
  styleTone: [
    {
      field: "description",
      label: "Descripción",
      multiline: true,
      minRows: 3,
    },
  ],
};

export function makeContextKey(
  sectionSlug: string,
  itemId: string,
  chapterId: string | null,
) {
  return chapterId
    ? `${sectionSlug}:${itemId}:${chapterId}`
    : `${sectionSlug}:${itemId}`;
}

export function buildContextFormValues(
  sections: ContextSection[],
): Record<string, ContextItemFormValue> {
  const result: Record<string, ContextItemFormValue> = {};

  for (const section of sections) {
    const sectionId = CONTEXT_SECTION_IDS_IN_ORDER.find(
      (id) => id === section.id,
    );
    if (!sectionId) {
      continue;
    }

    const fieldDescriptors = CONTEXT_FIELDS_BY_SECTION[sectionId];
    if (!fieldDescriptors?.length) {
      continue;
    }

    for (const item of section.items) {
      const key = makeContextKey(section.id, item.id, item.chapterId ?? null);
      const value: ContextItemFormValue = {
        id: item.id,
        sectionSlug: section.id,
        chapterId: item.chapterId ?? null,
        type: item.type,
      };

      for (const descriptor of fieldDescriptors) {
        const raw = item[descriptor.field as keyof ContextItem];
        const normalized =
          typeof raw === "string"
            ? raw
            : raw === null || raw === undefined
              ? ""
              : String(raw);
        value[descriptor.field] = normalized;
      }

      result[key] = value;
    }
  }

  return result;
}

export function cloneContextFormValues(
  values: Record<string, ContextItemFormValue>,
): Record<string, ContextItemFormValue> {
  const clone: Record<string, ContextItemFormValue> = {};
  for (const [key, entry] of Object.entries(values)) {
    clone[key] = { ...entry };
  }
  return clone;
}

export function getItemPrimaryText(item: ContextItem) {
  return item.title ?? item.name ?? "Sin título";
}
