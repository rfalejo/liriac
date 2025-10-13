import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChapterBlockUpdatePayload } from "../../../api/chapters";
import type {
  ChapterBlock,
  MetadataDraft,
  MetadataEditableField,
  MetadataKindOption,
} from "../types";

export type MetadataEditingSideEffects = {
  notifyUpdateFailure: (error: unknown) => void;
};

type MetadataBlock = ChapterBlock & { type: "metadata" };

type UseMetadataEditingStateParams = {
  block: MetadataBlock | null;
  isActive: boolean;
  isSaving: boolean;
  updateBlock: (args: {
    blockId: string;
    payload: ChapterBlockUpdatePayload;
  }) => Promise<unknown>;
  onComplete: () => void;
  sideEffects: MetadataEditingSideEffects;
};

type MetadataEditingHandlers = {
  draft: MetadataDraft;
  hasPendingChanges: boolean;
  kind: MetadataKindOption;
  onChangeField: (field: MetadataEditableField, value: string) => void;
  onChangeKind: (nextKind: MetadataKindOption) => void;
  save: () => Promise<boolean>;
};

const EMPTY_DRAFT: MetadataDraft = {
  title: "",
  subtitle: "",
  epigraph: "",
  epigraphAttribution: "",
  context: "",
  text: "",
};

const SUPPORTED_KINDS: MetadataKindOption[] = [
  "metadata",
  "context",
  "chapter_header",
];

function normalizeKind(
  kind: MetadataBlock["kind"],
): MetadataKindOption {
  if (!kind || !SUPPORTED_KINDS.includes(kind as MetadataKindOption)) {
    return "metadata";
  }

  return kind as MetadataKindOption;
}

function toDraft(block: MetadataBlock | null): MetadataDraft {
  if (!block) {
    return EMPTY_DRAFT;
  }

  return {
    title: block.title ?? "",
    subtitle: block.subtitle ?? "",
    epigraph: block.epigraph ?? "",
    epigraphAttribution: block.epigraphAttribution ?? "",
    context: block.context ?? "",
    text: block.text ?? "",
  };
}

function relevantFields(kind: MetadataBlock["kind"]): MetadataEditableField[] {
  if (kind === "chapter_header") {
    return ["title", "subtitle", "epigraph", "epigraphAttribution"];
  }
  if (kind === "context") {
    return ["context"];
  }
  return ["text"];
}

function readBlockField(
  block: MetadataBlock | null,
  field: MetadataEditableField,
): string {
  if (!block) {
    return "";
  }
  switch (field) {
    case "title":
      return block.title ?? "";
    case "subtitle":
      return block.subtitle ?? "";
    case "epigraph":
      return block.epigraph ?? "";
    case "epigraphAttribution":
      return block.epigraphAttribution ?? "";
    case "context":
      return block.context ?? "";
    case "text":
    default:
      return block.text ?? "";
  }
}

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function useMetadataEditingState({
  block,
  isActive,
  isSaving,
  updateBlock,
  onComplete,
  sideEffects,
}: UseMetadataEditingStateParams): MetadataEditingHandlers {
  const [draft, setDraft] = useState<MetadataDraft>(EMPTY_DRAFT);
  const [syncedBlockId, setSyncedBlockId] = useState<string | null>(null);
  const [kind, setKind] = useState<MetadataKindOption>(
    normalizeKind(block?.kind ?? null),
  );

  useEffect(() => {
    if (isActive && block) {
      setDraft(toDraft(block));
      setSyncedBlockId(block.id);
      setKind(normalizeKind(block.kind ?? null));
    }
  }, [block?.id, block?.kind, isActive]);

  useEffect(() => {
    if (!isActive) {
      setDraft(EMPTY_DRAFT);
      setSyncedBlockId(null);
      setKind("metadata");
    }
  }, [isActive]);

  const effectiveDraft = useMemo(() => {
    if (isActive && block && block.id !== syncedBlockId) {
      return toDraft(block);
    }
    return draft;
  }, [block, draft, isActive, syncedBlockId]);

  const effectiveKind = useMemo(() => {
    if (isActive && block && block.id !== syncedBlockId) {
      return normalizeKind(block.kind ?? null);
    }

    return kind;
  }, [block, isActive, kind, syncedBlockId]);

  const hasPendingChanges = useMemo(() => {
    if (!isActive || !block) {
      return false;
    }
    const baselineKind = normalizeKind(block.kind ?? null);
    const fields = relevantFields(effectiveKind as MetadataBlock["kind"]);
    const fieldChanged = fields.some((field) => {
      return effectiveDraft[field] !== readBlockField(block, field);
    });

    return baselineKind !== effectiveKind || fieldChanged;
  }, [block, effectiveDraft, effectiveKind, isActive]);

  const onChangeField = useCallback(
    (field: MetadataEditableField, value: string) => {
      if (!isActive) {
        return;
      }
      setDraft((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [isActive],
  );

  const onChangeKind = useCallback(
    (nextKind: MetadataKindOption) => {
      if (!isActive) {
        return;
      }

      setKind(nextKind);
    },
    [isActive],
  );

  const save = useCallback(async () => {
    if (!isActive || !block || isSaving) {
      return false;
    }

    if (!hasPendingChanges) {
      onComplete();
      return true;
    }

    const targetKind = effectiveKind;
    const payload: ChapterBlockUpdatePayload = {
      kind: targetKind,
    };

    if (targetKind === "chapter_header") {
      payload.title = toNullable(effectiveDraft.title);
      payload.subtitle = toNullable(effectiveDraft.subtitle);
      payload.epigraph = toNullable(effectiveDraft.epigraph);
      payload.epigraphAttribution = toNullable(
        effectiveDraft.epigraphAttribution,
      );
      payload.context = null;
      payload.text = "";
    } else if (targetKind === "context") {
      payload.context = toNullable(effectiveDraft.context);
      payload.title = null;
      payload.subtitle = null;
      payload.epigraph = null;
      payload.epigraphAttribution = null;
      payload.text = "";
    } else {
      payload.text = effectiveDraft.text;
      payload.title = null;
      payload.subtitle = null;
      payload.epigraph = null;
      payload.epigraphAttribution = null;
      payload.context = null;
    }

    try {
      await updateBlock({
        blockId: block.id,
        payload,
      });
      onComplete();
      return true;
    } catch (error) {
      sideEffects.notifyUpdateFailure(error);
      return false;
    }
  }, [
    block,
    effectiveKind,
    effectiveDraft.context,
    effectiveDraft.epigraph,
    effectiveDraft.epigraphAttribution,
    effectiveDraft.subtitle,
    effectiveDraft.text,
    effectiveDraft.title,
    hasPendingChanges,
    isActive,
    isSaving,
    onComplete,
    sideEffects,
    updateBlock,
  ]);

  return {
    draft: effectiveDraft,
    hasPendingChanges,
    onChangeField,
    save,
    kind: effectiveKind,
    onChangeKind,
  };
}
