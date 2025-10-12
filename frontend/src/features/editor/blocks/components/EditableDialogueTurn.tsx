import { Stack } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { useCallback, useMemo, type KeyboardEvent } from "react";
import type { DialogueField, DialogueTurn } from "../../types";
import {
  editorBodyTypographySx,
  editorThemeConstants,
} from "../../editorTheme";
import { DialogueEditableField } from "./DialogueEditableField";

export type EditableDialogueTurnProps = {
  turnKey: string;
  turn: DialogueTurn;
  disabled: boolean;
  onChangeTurn?: (
    turnId: string,
    field: DialogueField,
    value: string,
  ) => void;
  onKeyDown: (event: KeyboardEvent) => void;
};

const createSharedFieldSx = (overrides?: SxProps<Theme>): SxProps<Theme> => ({
  ...editorBodyTypographySx,
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
  '&:empty::before': {
    content: 'attr(data-placeholder)',
    color: "rgba(15, 20, 25, 0.45)",
    pointerEvents: "none",
  },
  '&[data-disabled="true"]': {
    color: "rgba(15, 20, 25, 0.5)",
    pointerEvents: "none",
  },
  ...overrides,
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
      createSharedFieldSx({
        fontSize: "0.85rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: editorThemeConstants.mutedColor,
      }),
    [],
  );

  const utteranceFieldSx = useMemo(
    () =>
      createSharedFieldSx({
        color: editorThemeConstants.headingColor,
      }),
    [],
  );

  const stageDirectionFieldSx = useMemo(
    () =>
      createSharedFieldSx({
        fontStyle: "italic",
        color: editorThemeConstants.mutedColor,
      }),
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
