import { Stack } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { useCallback, useMemo, type KeyboardEvent } from "react";
import type { DialogueField, DialogueTurn } from "../../types";
import { DialogueEditableField } from "./DialogueEditableField";

export type EditableDialogueTurnProps = {
  turnKey: string;
  turn: DialogueTurn;
  disabled: boolean;
  onChangeTurn?: (turnId: string, field: DialogueField, value: string) => void;
  onKeyDown: (event: KeyboardEvent) => void;
};

type FieldOverride = (theme: Theme) => Record<string, unknown>;

const createSharedFieldSx = (overrides?: FieldOverride) => (theme: Theme) => ({
  ...theme.typography.editorBody,
  width: "100%",
  minHeight: "1.4em",
  whiteSpace: "pre-wrap",
  outline: "none",
  border: "none",
  backgroundColor: "transparent",
  padding: 0,
  margin: 0,
  transition: "color 120ms ease",
  "&:focus": {
    outline: "none",
  },
  "&:empty::before": {
    content: "attr(data-placeholder)",
    color: theme.palette.editor.blockPlaceholderText,
    pointerEvents: "none",
  },
  '&[data-disabled="true"]': {
    color: theme.palette.editor.blockDisabledText,
    pointerEvents: "none",
  },
  ...(overrides ? overrides(theme) : {}),
});

export function EditableDialogueTurn({
  turnKey,
  turn,
  disabled,
  onChangeTurn,
  onKeyDown,
}: EditableDialogueTurnProps) {
  const handleInput = useCallback(
    (field: DialogueField, value: string) => {
      onChangeTurn?.(turnKey, field, value);
    },
    [onChangeTurn, turnKey],
  );

  const speakerFieldSx = useMemo(
    () =>
      createSharedFieldSx((theme: Theme) => ({
        fontSize: "0.85rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: theme.palette.editor.blockMuted,
      })),
    [],
  );

  const utteranceFieldSx = useMemo(
    () =>
      createSharedFieldSx((theme: Theme) => ({
        color: theme.palette.editor.blockHeading,
      })),
    [],
  );

  const stageDirectionFieldSx = useMemo(
    () =>
      createSharedFieldSx((theme: Theme) => ({
        fontStyle: "italic",
        color: theme.palette.editor.blockMuted,
      })),
    [],
  );

  return (
    <Stack spacing={0.75}>
      <DialogueEditableField
        value={turn.speakerName ?? ""}
        placeholder="Nombre del personaje"
        disabled={disabled}
        sx={speakerFieldSx}
        ariaLabel="Nombre del personaje"
        onInput={(value) => handleInput("speakerName", value)}
        onKeyDown={onKeyDown}
      />
      <DialogueEditableField
        value={turn.utterance ?? ""}
        placeholder="Escribe el parlamento"
        disabled={disabled}
        sx={utteranceFieldSx}
        ariaLabel="Parlamento"
        onInput={(value) => handleInput("utterance", value)}
        onKeyDown={onKeyDown}
      />
      <DialogueEditableField
        value={turn.stageDirection ?? ""}
        placeholder="Escribe la acotación"
        disabled={disabled}
        sx={stageDirectionFieldSx}
        ariaLabel="Acotación"
        onInput={(value) => handleInput("stageDirection", value)}
        onKeyDown={onKeyDown}
      />
    </Stack>
  );
}
