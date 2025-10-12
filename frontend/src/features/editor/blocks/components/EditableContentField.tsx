import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type {
  ClipboardEvent as ReactClipboardEvent,
  KeyboardEventHandler,
} from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";

type EditableContentFieldProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  multiline?: boolean;
  sx?: SxProps<Theme>;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  disabled?: boolean;
};

export function EditableContentField({
  value,
  onChange,
  ariaLabel,
  placeholder,
  multiline = false,
  sx,
  onKeyDown,
  disabled = false,
}: EditableContentFieldProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = editorRef.current;
    if (!node) {
      return;
    }
    if (disabled) {
      if (node.textContent !== value) {
        node.textContent = value;
      }
      return;
    }
    if (node.textContent !== value) {
      node.textContent = value;
    }
  }, [disabled, value]);

  const handleInput = useCallback(() => {
    const node = editorRef.current;
    if (!node) {
      return;
    }
    if (disabled) {
      if (node.textContent !== value) {
        node.textContent = value;
      }
      return;
    }
    onChange(node.textContent ?? "");
  }, [disabled, onChange, value]);

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      if (!multiline && event.key === "Enter") {
        event.preventDefault();
      }

      onKeyDown?.(event);
    },
    [multiline, onKeyDown],
  );

  const handlePaste = useCallback(
    (event: ReactClipboardEvent<HTMLDivElement>) => {
    const node = editorRef.current;
    if (!node) {
      return;
    }
      if (disabled) {
        return;
      }

    event.preventDefault();
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return;
      }

      const text = event.clipboardData.getData("text/plain");
      selection.deleteFromDocument();
      const range = selection.getRangeAt(0);
      range.insertNode(document.createTextNode(text));
      selection.collapseToEnd();
      onChange(node.textContent ?? "");
    },
    [disabled, onChange],
  );

  const baseStyles = useCallback(
    (theme: Theme) => {
      const styles: Record<string, unknown> = {
        outline: "none",
        whiteSpace: multiline ? "pre-wrap" : "pre-line",
        wordBreak: "break-word",
      };

      if (multiline) {
        styles.minHeight = theme.spacing(4.5);
      }

      if (placeholder) {
        styles["&:empty:before"] = {
          content: 'attr(data-placeholder)',
          color: theme.palette.editor.blockMuted,
          opacity: 0.75,
        };
      }

      return styles;
    },
    [multiline, placeholder],
  );

  const combinedSx = useMemo(() => {
    if (!sx) {
      return baseStyles as SxProps<Theme>;
    }

    const additional: SxProps<Theme>[] = Array.isArray(sx)
      ? (sx as SxProps<Theme>[])
      : [sx as SxProps<Theme>];

    return [baseStyles, ...additional] as SxProps<Theme>;
  }, [baseStyles, sx]);

  return (
    <Box
      ref={editorRef}
      suppressContentEditableWarning
      role="textbox"
      aria-multiline={multiline}
      aria-label={ariaLabel}
  aria-disabled={disabled}
  contentEditable={disabled ? "false" : "true"}
  tabIndex={disabled ? -1 : 0}
      spellCheck
      data-placeholder={placeholder ?? ""}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
  onPaste={handlePaste}
      sx={combinedSx}
    />
  );
}
