import { useCallback, useEffect, useMemo, useState } from "react";
import type { components } from "../../api/schema";
import { useEditorScrollbar } from "./hooks/useEditorScrollbar";
import { useEditorChapterNavigation } from "./hooks/useEditorChapterNavigation";
import { useSidebarHover } from "./hooks/useSidebarHover";
import { EditorShell } from "./EditorShell";
import { useUpdateChapterBlock } from "./hooks/useUpdateChapterBlock";

type ChapterBlock = components["schemas"]["ChapterBlock"];
type DialogueTurn = components["schemas"]["DialogueTurn"];

type DialogField = "speakerName" | "utterance" | "stageDirection";

type EditingState =
  | {
      blockId: string;
      blockType: "paragraph";
      paragraph: {
        draftText: string;
        onChangeDraft: (value: string) => void;
      };
      onCancel: () => void;
      onSave: () => void;
      isSaving: boolean;
    }
  | {
      blockId: string;
      blockType: "dialogue";
      dialogue: {
        turns: DialogueTurn[];
        onChangeTurn: (index: number, field: DialogField, value: string) => void;
        onAddTurn: () => void;
        onRemoveTurn: (index: number) => void;
      };
      onCancel: () => void;
      onSave: () => void;
      isSaving: boolean;
    };

function cloneTurns(turns: DialogueTurn[] | undefined): DialogueTurn[] {
  if (!turns?.length) {
    return [];
  }
  return turns.map((turn) => ({
    speakerId: turn.speakerId ?? null,
    speakerName: turn.speakerName ?? "",
    utterance: turn.utterance ?? "",
    stageDirection: turn.stageDirection ?? null,
    tone: turn.tone ?? null,
  }));
}

function equalTurns(a: DialogueTurn[], b: DialogueTurn[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let index = 0; index < a.length; index += 1) {
    const left = a[index];
    const right = b[index];
    if ((left.speakerName ?? "") !== (right.speakerName ?? "")) {
      return false;
    }
    if ((left.utterance ?? "") !== (right.utterance ?? "")) {
      return false;
    }
    if ((left.stageDirection ?? "") !== (right.stageDirection ?? "")) {
      return false;
    }
  }
  return true;
}

type EditorContainerProps = {
  chapterId: string;
  open: boolean;
  onClose: () => void;
};

export function EditorContainer({
  chapterId,
  open,
  onClose,
}: EditorContainerProps) {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingBlockType, setEditingBlockType] =
    useState<ChapterBlock["type"] | null>(null);
  const [draftText, setDraftText] = useState<string>("");
  const [draftTurns, setDraftTurns] = useState<DialogueTurn[]>([]);

  const {
    activeChapterId,
    chapter,
    chapterOptions,
    booksError,
    booksLoading,
    bookTitle,
    contentSignature,
    error,
    handleSelectChapter,
    loading,
    reload,
  } = useEditorChapterNavigation({ chapterId });

  const { scrollAreaRef, handlers, scrollbarClassName } = useEditorScrollbar(
    open,
    contentSignature,
  );

  const { updateBlock, isPending: blockUpdatePending } = useUpdateChapterBlock({
    chapterId: chapter?.id,
  });

  useEffect(() => {
    setEditingBlockId(null);
    setDraftText("");
    setDraftTurns([]);
    setEditingBlockType(null);
  }, [chapter?.id]);

  const getBlockById = useCallback(
    (targetId: string) => {
      if (!chapter) {
        return null;
      }
      const target = chapter.blocks.find((item) => item.id === targetId);
      return target ?? null;
    },
    [chapter],
  );

  const getParagraphBlock = useCallback(
    (targetId: string) => {
      const block = getBlockById(targetId);
      if (block?.type !== "paragraph") {
        return null;
      }
      return block;
    },
    [getBlockById],
  );

  const getDialogueBlock = useCallback(
    (targetId: string) => {
      const block = getBlockById(targetId);
      if (block?.type !== "dialogue") {
        return null;
      }
      return block;
    },
    [getBlockById],
  );

  const hasPendingChanges = useCallback(() => {
    if (!editingBlockId || !editingBlockType) {
      return false;
    }
    if (editingBlockType === "paragraph") {
      const current = getParagraphBlock(editingBlockId);
      const original = current?.text ?? "";
      return draftText !== original;
    }
    if (editingBlockType === "dialogue") {
      const current = getDialogueBlock(editingBlockId);
      const originalTurns = cloneTurns(current?.turns ?? []);
      return !equalTurns(draftTurns, originalTurns);
    }
    return false;
  }, [
    draftText,
    draftTurns,
    editingBlockId,
    editingBlockType,
    getDialogueBlock,
    getParagraphBlock,
  ]);

  const handleEditBlock = useCallback(
    (blockId: string) => {
      if (blockUpdatePending) {
        return;
      }

      const target = getBlockById(blockId);
      if (!target) {
        return;
      }

      if (editingBlockId && editingBlockId !== blockId && hasPendingChanges()) {
        const confirmSwitch = window.confirm(
          "¿Quieres descartar los cambios pendientes?",
        );
        if (!confirmSwitch) {
          return;
        }
      }

      setEditingBlockId(blockId);
      setEditingBlockType(target.type);

      if (target.type === "paragraph") {
        setDraftText(target.text ?? "");
        setDraftTurns([]);
        return;
      }

      if (target.type === "dialogue") {
        setDraftText("");
        setDraftTurns(cloneTurns(target.turns));
        return;
      }

      setDraftText("");
      setDraftTurns([]);
    },
    [
      blockUpdatePending,
      editingBlockId,
      getBlockById,
      hasPendingChanges,
    ],
  );

  const handleDraftChange = useCallback((value: string) => {
    if (editingBlockType !== "paragraph") {
      return;
    }
    setDraftText(value);
  }, [editingBlockType]);

  const handleDialogueTurnChange = useCallback(
    (index: number, field: DialogField, value: string) => {
      if (editingBlockType !== "dialogue") {
        return;
      }
      setDraftTurns((prev) => {
        if (index < 0 || index >= prev.length) {
          return prev;
        }
        const next = [...prev];
        const draft = { ...next[index] };
        if (field === "speakerName") {
          draft.speakerName = value;
        }
        if (field === "utterance") {
          draft.utterance = value;
        }
        if (field === "stageDirection") {
          draft.stageDirection = value ? value : null;
        }
        next[index] = draft;
        return next;
      });
    },
    [editingBlockType],
  );

  const handleAddDialogueTurn = useCallback(() => {
    if (editingBlockType !== "dialogue") {
      return;
    }
    setDraftTurns((prev) => [
      ...prev,
      {
        speakerId: null,
        speakerName: "",
        utterance: "",
        stageDirection: null,
        tone: null,
      },
    ]);
  }, [editingBlockType]);

  const handleRemoveDialogueTurn = useCallback(
    (index: number) => {
      if (editingBlockType !== "dialogue") {
        return;
      }
      setDraftTurns((prev) => {
        if (index < 0 || index >= prev.length) {
          return prev;
        }
        const next = [...prev];
        next.splice(index, 1);
        return next;
      });
    },
    [editingBlockType],
  );

  const handleCancelEdit = useCallback(() => {
    if (!editingBlockId || !editingBlockType) {
      return;
    }

    if (hasPendingChanges()) {
      const confirmCancel = window.confirm(
        "¿Deseas descartar los cambios?",
      );
      if (!confirmCancel) {
        return;
      }
    }

    setEditingBlockType(null);
    setEditingBlockId(null);
    setDraftText("");
    setDraftTurns([]);
  }, [editingBlockId, editingBlockType, hasPendingChanges]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingBlockId || !chapter || blockUpdatePending || !editingBlockType) {
      return;
    }

    try {
      if (editingBlockType === "paragraph") {
        const current = getParagraphBlock(editingBlockId);
        const originalText = current?.text ?? "";
        if (draftText === originalText) {
          setEditingBlockId(null);
          setEditingBlockType(null);
          return;
        }

        await updateBlock({
          blockId: editingBlockId,
          payload: { text: draftText },
        });
      } else if (editingBlockType === "dialogue") {
        const current = getDialogueBlock(editingBlockId);
        const originalTurns = cloneTurns(current?.turns ?? []);
        if (equalTurns(draftTurns, originalTurns)) {
          setEditingBlockId(null);
          setEditingBlockType(null);
          return;
        }

        await updateBlock({
          blockId: editingBlockId,
          payload: { turns: draftTurns },
        });
      } else {
        return;
      }

      setEditingBlockId(null);
      setDraftText("");
      setDraftTurns([]);
      setEditingBlockType(null);
    } catch (error) {
      console.error("Failed to update block", error);
      window.alert("No se pudieron guardar los cambios. Intenta de nuevo.");
    }
  }, [
    blockUpdatePending,
    chapter,
    draftText,
    draftTurns,
    editingBlockId,
    editingBlockType,
    getDialogueBlock,
    getParagraphBlock,
    updateBlock,
  ]);

  const handleInsertBlock = useCallback(
    (
      blockType: components["schemas"]["ChapterBlockTypeEnum"],
      position: {
        afterBlockId: string | null;
        beforeBlockId: string | null;
        index: number;
      },
    ) => {
      void blockType;
      void position;
    },
    [],
  );
  const { sidebarVisible, handleSidebarEnter, handleSidebarLeave } =
    useSidebarHover({ open });

  const selectedChapterId = chapter?.id ?? activeChapterId;

  const editingState = useMemo<EditingState | undefined>(() => {
    if (!editingBlockId || !editingBlockType) {
      return undefined;
    }

    if (editingBlockType === "paragraph") {
      return {
        blockId: editingBlockId,
        blockType: "paragraph",
        paragraph: {
          draftText,
          onChangeDraft: handleDraftChange,
        },
        onCancel: handleCancelEdit,
        onSave: () => {
          void handleSaveEdit();
        },
        isSaving: blockUpdatePending,
      };
    }

    if (editingBlockType === "dialogue") {
      return {
        blockId: editingBlockId,
        blockType: "dialogue",
        dialogue: {
          turns: draftTurns,
          onChangeTurn: handleDialogueTurnChange,
          onAddTurn: handleAddDialogueTurn,
          onRemoveTurn: handleRemoveDialogueTurn,
        },
        onCancel: handleCancelEdit,
        onSave: () => {
          void handleSaveEdit();
        },
        isSaving: blockUpdatePending,
      };
    }

    return undefined;
  }, [
    blockUpdatePending,
    draftText,
    draftTurns,
    editingBlockId,
    editingBlockType,
    handleAddDialogueTurn,
    handleCancelEdit,
    handleDialogueTurnChange,
    handleDraftChange,
    handleRemoveDialogueTurn,
    handleSaveEdit,
  ]);

  return (
    <EditorShell
      sidebarProps={{
        activeChapterId: selectedChapterId,
        bookTitle,
        chapters: chapterOptions,
        error: booksError,
        loading: booksLoading,
        onClose,
        onEnter: handleSidebarEnter,
        onLeave: handleSidebarLeave,
        onSelectChapter: handleSelectChapter,
        visible: sidebarVisible,
      }}
      chapterViewProps={{
        loading,
        error,
        chapter,
        onRetry: reload,
        onEditBlock: handleEditBlock,
        onInsertBlock: handleInsertBlock,
        editingState,
      }}
      scrollAreaRef={scrollAreaRef}
      scrollHandlers={handlers}
      scrollbarClassName={scrollbarClassName}
    />
  );
}
