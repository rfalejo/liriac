import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ContextItemFormValue,
  ContextSectionId,
} from "../components/bookContextHelpers";
import {
  buildContextFormValues,
  cloneContextFormValues,
  CONTEXT_FIELDS_BY_SECTION,
  CONTEXT_ITEM_TYPE_BY_SECTION,
  CONTEXT_SECTION_IDS_IN_ORDER,
  makeContextKey,
  type ContextEditableField,
} from "../components/bookContextHelpers";
import { useLibrarySections } from "./useLibrarySections";
import { useUpdateLibraryContext } from "./useUpdateLibraryContext";
import { useCreateLibraryContextItem } from "./useCreateLibraryContextItem";
import { useDeleteLibraryContextItem } from "./useDeleteLibraryContextItem";
import type { ContextItemUpdate, ContextSection } from "../../../api/library";

type UseBookContextEditorArgs = {
  bookId: string;
  onClearError: () => void;
  onMutationError: (message: string) => void;
};

function buildContextUpdates(
  contextSections: ContextSection[],
  contextFormValues: Record<string, ContextItemFormValue>,
  initialValues: Record<string, ContextItemFormValue>,
): ContextItemUpdate[] {
  const updates: ContextItemUpdate[] = [];

  for (const section of contextSections) {
    const sectionId = CONTEXT_SECTION_IDS_IN_ORDER.find((id) => id === section.id);
    if (!sectionId) {
      continue;
    }

    const descriptors = CONTEXT_FIELDS_BY_SECTION[sectionId];
    if (!descriptors?.length) {
      continue;
    }

    for (const item of section.items) {
      const key = makeContextKey(section.id, item.id, item.chapterId ?? null);
      const current = contextFormValues[key];
      const initial = initialValues[key];

      if (!current || !initial) {
        continue;
      }

      const payload: Partial<ContextItemUpdate> = {
        id: current.id,
        sectionSlug: current.sectionSlug,
      };

      if (current.chapterId) {
        payload.chapterId = current.chapterId;
      } else if (initial.chapterId) {
        payload.chapterId = null;
      }

      let hasChanges = false;

      for (const descriptor of descriptors) {
        const field = descriptor.field;
        const currentValue = (current[field] ?? "").trim();
        const initialValue = (initial[field] ?? "").trim();

        if (currentValue !== initialValue) {
          payload[field] = currentValue;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        updates.push(payload as ContextItemUpdate);
      }
    }
  }

  return updates;
}

export function useBookContextEditor({
  bookId,
  onClearError,
  onMutationError,
}: UseBookContextEditorArgs) {
  const {
    sections: rawSections,
    loading: contextLoading,
    error: contextError,
    reload: reloadContext,
  } = useLibrarySections(bookId);

  const { mutateAsync: updateContextItems, isPending: isUpdatingContext } =
    useUpdateLibraryContext(bookId);
  const { mutateAsync: createContextItem, isPending: isCreatingContextItem } =
    useCreateLibraryContextItem(bookId);
  const { mutateAsync: deleteContextItem, isPending: isDeletingContextMutation } =
    useDeleteLibraryContextItem(bookId);

  const [contextFormValues, setContextFormValues] = useState<
    Record<string, ContextItemFormValue>
  >({});
  const contextInitialRef = useRef<Record<string, ContextItemFormValue>>({});
  const [creatingContextSection, setCreatingContextSection] =
    useState<ContextSectionId | null>(null);
  const [deletingContextItems, setDeletingContextItems] = useState<
    Record<string, boolean>
  >({});

  const contextSections = useMemo(() => {
    const sectionsById = new Map<string, ContextSection>();
    for (const section of rawSections) {
      sectionsById.set(section.id, section);
    }

    return CONTEXT_SECTION_IDS_IN_ORDER.map((sectionId) =>
      sectionsById.get(sectionId),
    ).filter((section): section is ContextSection => Boolean(section));
  }, [rawSections]);

  useEffect(() => {
    const nextValues = buildContextFormValues(contextSections);
    setContextFormValues((current) => {
      const merged: Record<string, ContextItemFormValue> = {};

      for (const [key, baseValue] of Object.entries(nextValues)) {
        const existing = current[key];
        if (!existing) {
          merged[key] = baseValue;
          continue;
        }

        const sectionId = CONTEXT_SECTION_IDS_IN_ORDER.find(
          (id) => id === baseValue.sectionSlug,
        );
        const mergedValue: ContextItemFormValue = { ...baseValue };

        if (sectionId) {
          const descriptors = CONTEXT_FIELDS_BY_SECTION[sectionId] ?? [];
          for (const descriptor of descriptors) {
            const field = descriptor.field;
            if (Object.prototype.hasOwnProperty.call(existing, field)) {
              mergedValue[field] = existing[field];
            }
          }
        }

        merged[key] = mergedValue;
      }

      return merged;
    });
    contextInitialRef.current = cloneContextFormValues(nextValues);
  }, [contextSections]);

  const handleContextFieldChange = useCallback(
    (
      sectionSlug: string,
      itemId: string,
      chapterId: string | null,
      type: ContextItemFormValue["type"],
      field: ContextEditableField,
      value: string,
    ) => {
      const key = makeContextKey(sectionSlug, itemId, chapterId);

      setContextFormValues((current) => {
        const existing = current[key] ?? {
          id: itemId,
          sectionSlug,
          chapterId,
          type,
        };

        return {
          ...current,
          [key]: {
            ...existing,
            type: existing.type ?? type,
            chapterId: existing.chapterId ?? chapterId,
            [field]: value,
          },
        };
      });
    },
    [],
  );

  const pendingContextUpdates = useMemo(
    () => buildContextUpdates(contextSections, contextFormValues, contextInitialRef.current),
    [contextFormValues, contextSections],
  );

  const contextHasChanges = pendingContextUpdates.length > 0;

  const submitContextUpdates = useCallback(async () => {
    if (!contextHasChanges) {
      return { success: false };
    }

    try {
      await updateContextItems(pendingContextUpdates);
      contextInitialRef.current = cloneContextFormValues(contextFormValues);
      onClearError();
      return { success: true };
    } catch (error) {
      console.error("Failed to update context", error);
      onMutationError("No se pudo guardar el contexto. Intenta nuevamente.");
      return { success: false };
    }
  }, [
    contextFormValues,
    contextHasChanges,
    onClearError,
    onMutationError,
    pendingContextUpdates,
    updateContextItems,
  ]);

  const handleAddContextItem = useCallback(
    (sectionId: ContextSectionId) => {
      const itemType = CONTEXT_ITEM_TYPE_BY_SECTION[sectionId];
      if (!itemType) {
        return;
      }

      onClearError();
      setCreatingContextSection(sectionId);

      void (async () => {
        try {
          await createContextItem({
            sectionSlug: sectionId,
            type: itemType,
          });
        } catch (error) {
          console.error("Failed to create context item", error);
          onMutationError("No se pudo crear el elemento. Intenta nuevamente.");
        } finally {
          setCreatingContextSection(null);
        }
      })();
    },
    [createContextItem, onClearError, onMutationError],
  );

  const handleDeleteContextItem = useCallback(
    (sectionSlug: string, itemId: string, chapterId: string | null) => {
      const normalizedChapterId = chapterId ?? null;
      const key = makeContextKey(sectionSlug, itemId, normalizedChapterId);

      onClearError();
      setDeletingContextItems((current) => ({ ...current, [key]: true }));

      void (async () => {
        try {
          await deleteContextItem({
            sectionSlug,
            itemId,
            chapterId: normalizedChapterId ?? undefined,
          });

          setContextFormValues((current) => {
            if (!current[key]) {
              return current;
            }
            const next = { ...current };
            delete next[key];
            return next;
          });

          const nextInitial = { ...contextInitialRef.current };
          delete nextInitial[key];
          contextInitialRef.current = nextInitial;
        } catch (error) {
          console.error("Failed to delete context item", error);
          onMutationError("No se pudo eliminar el elemento. Intenta nuevamente.");
        } finally {
          setDeletingContextItems((current) => {
            if (!current[key]) {
              return current;
            }
            const next = { ...current };
            delete next[key];
            return next;
          });
        }
      })();
    },
    [deleteContextItem, onClearError, onMutationError],
  );

  const isDeletingContextItem =
    isDeletingContextMutation || Object.keys(deletingContextItems).length > 0;

  return {
    contextSections,
    contextFormValues,
    contextLoading,
    contextError,
    contextHasChanges,
    handleContextFieldChange,
    handleAddContextItem,
    handleDeleteContextItem,
    submitContextUpdates,
    reloadContext,
    creatingContextSection,
    isCreatingContextItem,
    isUpdatingContext,
    deletingContextItems,
    isDeletingContextItem,
  };
}
