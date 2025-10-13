import { useCallback, useRef, useState } from "react";

export type ConfirmDialogTone = "warning" | "danger";

export type ConfirmDialogOptions = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: ConfirmDialogTone;
};

type Resolver = (decision: boolean) => void;

export type ConfirmDialogState = ConfirmDialogOptions;

export function useEditorConfirmDialog() {
  const resolverRef = useRef<Resolver | null>(null);
  const [dialogState, setDialogState] = useState<ConfirmDialogState | null>(null);

  const openConfirmDialog = useCallback(
    (options: ConfirmDialogOptions) =>
      new Promise<boolean>((resolve) => {
        resolverRef.current = (decision) => {
          resolve(decision);
          resolverRef.current = null;
          setDialogState(null);
        };
        setDialogState(options);
      }),
    [],
  );

  const resolveDialog = useCallback((decision: boolean) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setDialogState(null);
    if (resolver) {
      resolver(decision);
    }
  }, []);

  return {
    dialogState,
    openConfirmDialog,
    resolveDialog,
  };
}
