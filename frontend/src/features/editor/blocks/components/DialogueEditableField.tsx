import { Box } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";

export type DialogueEditableFieldProps = {
  value: string;
  placeholder: string;
  disabled: boolean;
  sx: (theme: Theme) => Record<string, unknown>;
  ariaLabel: string;
  onInput: (value: string) => void;
  onKeyDown: (event: KeyboardEvent) => void;
};

export const DialogueEditableField = forwardRef<
  HTMLDivElement,
  DialogueEditableFieldProps
>(
  (
    { value, placeholder, disabled, sx, ariaLabel, onInput, onKeyDown },
    ref,
  ) => {
    const innerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      const node = innerRef.current;
      if (!node) {
        return;
      }

      if ((node.textContent ?? "") !== value) {
        node.textContent = value;
      }
    }, [value]);

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        innerRef.current = node;
        if (!ref) {
          return;
        }

        if (typeof ref === "function") {
          ref(node);
        } else {
          ref.current = node;
        }
      },
      [ref],
    );

    const handleInputEvent = useCallback(
      (event: FormEvent<HTMLDivElement>) => {
        if (disabled) {
          return;
        }

        onInput(event.currentTarget.textContent ?? "");
      },
      [disabled, onInput],
    );

    return (
      <Box
        ref={setRefs}
        role="textbox"
        aria-label={ariaLabel}
        aria-multiline
        contentEditable={!disabled}
        suppressContentEditableWarning
        spellCheck
        data-placeholder={placeholder}
        data-disabled={disabled ? "true" : "false"}
        onInput={handleInputEvent}
        onKeyDown={onKeyDown}
        sx={(theme: Theme) => ({
          ...sx(theme),
          cursor: disabled ? "not-allowed" : "text",
        })}
      />
    );
  },
);

DialogueEditableField.displayName = "DialogueEditableField";
