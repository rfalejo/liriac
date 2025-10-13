import { useCallback, useEffect, useRef } from "react";
import type { components } from "../../api/schema";
import { useEditorScrollbar } from "./hooks/useEditorScrollbar";
import { useEditorChapterNavigation } from "./hooks/useEditorChapterNavigation";
import { useSidebarHover } from "./hooks/useSidebarHover";
import { EditorShell } from "./EditorShell";
import { useUpdateChapterBlock } from "./hooks/useUpdateChapterBlock";
import { useCreateChapterBlock } from "./hooks/useCreateChapterBlock";
import { useEditorEditingState } from "./hooks/useEditorEditingState";
import { showBlockUpdateErrorToast } from "./utils/showBlockUpdateErrorToast";
import { generateTurnId } from "./utils/dialogueTurns";
import type { EditingDiscardContext } from "./hooks/editing/types";
import type { ChapterBlockCreatePayload } from "../../api/chapters";

type ChapterBlockType = components["schemas"]["ChapterBlockTypeEnum"];

function generateBlockId(): string {
  const cryptoRef =
    typeof globalThis !== "undefined"
      ? (globalThis.crypto as Crypto | undefined)
      : undefined;
  if (cryptoRef && "randomUUID" in cryptoRef) {
    return cryptoRef.randomUUID();
  }
  return `local-block-${Math.random().toString(36).slice(2, 10)}`;
}

function buildDefaultBlockPayload(
  blockType: ChapterBlockType,
  blockId: string,
): ChapterBlockCreatePayload {
  if (blockType === "paragraph") {
    return {
      id: blockId,
      type: blockType,
      text: "",
      style: "narration",
      tags: [],
    };
  }

  if (blockType === "dialogue") {
    return {
      id: blockId,
      type: blockType,
      turns: [
        {
          id: generateTurnId(),
          speakerId: null,
          speakerName: "",
          utterance: "",
          stageDirection: null,
          tone: null,
        },
      ],
      context: null,
    };
  }

  if (blockType === "scene_boundary") {
    return {
      id: blockId,
      type: blockType,
      label: "",
      summary: "",
      locationId: null,
      locationName: null,
      timestamp: null,
      mood: null,
    };
  }

  return {
    id: blockId,
    type: "metadata",
    kind: "editorial",
    title: "",
    subtitle: "",
    status: "draft",
    owner: null,
    lastUpdated: null,
    text: "",
  };
}

function attachPosition(
  payload: ChapterBlockCreatePayload,
  position: {
    afterBlockId: string | null;
    beforeBlockId: string | null;
  },
  chapter: components["schemas"]["ChapterDetail"] | null,
): ChapterBlockCreatePayload {
  if (!chapter) {
    return payload;
  }

  const blocks = chapter.blocks ?? [];

  if (position.beforeBlockId) {
    const target = blocks.find((block) => block.id === position.beforeBlockId);
    if (target && typeof target.position === "number") {
      return {
        ...payload,
        position: target.position,
      };
    }
  }

  if (position.afterBlockId) {
    const target = blocks.find((block) => block.id === position.afterBlockId);
    if (target && typeof target.position === "number") {
      return {
        ...payload,
        position: target.position + 1,
      };
    }
  }

  const maxPosition = blocks.reduce<number | null>((acc, block) => {
    if (typeof block.position !== "number") {
      return acc;
    }
    if (acc === null) {
      return block.position;
    }
    return Math.max(acc, block.position);
  }, null);

  return {
    ...payload,
    position: typeof maxPosition === "number" ? maxPosition + 1 : 0,
  };
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

  const { scrollAreaRef, handlers, scrollbarState } = useEditorScrollbar(
    open,
    contentSignature,
  );

  const { updateBlock, isPending: blockUpdatePending } = useUpdateChapterBlock({
    chapterId: chapter?.id,
  });

  const { createBlock, isPending: blockCreatePending } = useCreateChapterBlock({
    chapterId: chapter?.id,
  });

  const confirmDiscardChanges = useCallback(
    (context: EditingDiscardContext) => {
      const message =
        context === "cancel"
          ? "¿Deseas descartar los cambios?"
          : "¿Quieres descartar los cambios pendientes?";
      return window.confirm(message);
    },
    [],
  );

  const notifyUpdateFailure = useCallback((error: unknown) => {
    showBlockUpdateErrorToast(error);
  }, []);

  const mutationPending = blockUpdatePending || blockCreatePending;

  const { editingState, handleEditBlock } = useEditorEditingState({
    chapter,
    updateBlock,
    blockUpdatePending: mutationPending,
    sideEffects: {
      confirmDiscardChanges,
      notifyUpdateFailure,
    },
  });

  const handleEditBlockRef = useRef(handleEditBlock);

  useEffect(() => {
    handleEditBlockRef.current = handleEditBlock;
  }, [handleEditBlock]);

  const handleInsertBlock = useCallback(
    (
      blockType: components["schemas"]["ChapterBlockTypeEnum"],
      position: {
        afterBlockId: string | null;
        beforeBlockId: string | null;
        index: number;
      },
    ) => {
      if (!chapter?.id || mutationPending) {
        return;
      }

      const blockId = generateBlockId();
      const payload = attachPosition(
        buildDefaultBlockPayload(blockType, blockId),
        position,
        chapter,
      );

      createBlock({ payload })
        .then(() => {
          setTimeout(() => {
            handleEditBlockRef.current(blockId);
          }, 0);
        })
        .catch((error) => {
          notifyUpdateFailure(error);
        });
    },
    [chapter, createBlock, mutationPending, notifyUpdateFailure],
  );
  const { sidebarVisible, handleSidebarEnter, handleSidebarLeave } =
    useSidebarHover({ open });

  const selectedChapterId = chapter?.id ?? activeChapterId;

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
      scrollbarState={scrollbarState}
    />
  );
}
