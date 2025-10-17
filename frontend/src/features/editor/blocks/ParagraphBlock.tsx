import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import type { components } from "../../../api/schema";
import type { BlockRenderContext } from "./blockRegistry";
import type { ParagraphEditingState } from "../types";
import { EditableBlock } from "./components/EditableBlock";
import { EditableContentField } from "./components/EditableContentField";
import {
  createBlockEditingSelector,
  createEditingShortcutHandler,
} from "./utils/blockEditingHelpers";

type ChapterBlock = components["schemas"]["ChapterBlock"];

type ParagraphBlockProps = {
  block: ChapterBlock;
  context: BlockRenderContext;
};

export function ParagraphBlock({ block, context }: ParagraphBlockProps) {
  const trimmed = block.text?.trim() ?? "";
  const shouldUseDropCap = context.isFirstParagraph && trimmed.length > 0;

  return (
    <EditableBlock<ParagraphEditingState>
      block={block}
      selectEditingState={createBlockEditingSelector("paragraph")}
      renderReadView={(currentBlock) => {
        const content = currentBlock.text?.trim() ?? "";
        return (
          <Typography
            component="p"
            sx={(theme: Theme) => ({
              ...theme.typography.editorParagraph,
              ...(shouldUseDropCap
                ? {
                    textIndent: 0,
                    "&::first-letter": {
                      fontSize: "3.25rem",
                      lineHeight: 0.88,
                      float: "left",
                      paddingRight: theme.spacing(1),
                      marginTop: theme.spacing(0.25),
                      fontFamily: theme.typography.h3.fontFamily,
                      fontWeight: theme.typography.h3.fontWeight,
                    },
                  }
                : {}),
            })}
          >
            {content.length > 0 ? content : "(Sin texto en este párrafo)"}
          </Typography>
        );
      }}
      renderEditView={(currentBlock, editing) => (
        <ParagraphEditView blockId={currentBlock.id} editingState={editing} />
      )}
    />
  );
}

type ParagraphEditViewProps = {
  blockId: string;
  editingState: ParagraphEditingState;
};

function ParagraphEditView({ blockId, editingState }: ParagraphEditViewProps) {
  const draftText = editingState.paragraph.draftText;

  const handleKeyDown =
    createEditingShortcutHandler<HTMLDivElement>(editingState);

  const placeholder = "Añade texto para este párrafo";
  const ariaLabel = "Editor de párrafo";

  return (
    <Stack spacing={1.5} alignItems="stretch">
      <EditableContentField
        value={draftText}
        onChange={editingState.paragraph.onChangeDraft}
        ariaLabel={ariaLabel}
        placeholder={placeholder}
        multiline
        autoFocus
        focusKey={blockId}
        selectionBehavior="caret-at-end"
        onKeyDown={handleKeyDown}
        spellCheck
        sx={(theme: Theme) => theme.typography.editorParagraphEditable}
      />
    </Stack>
  );
}
