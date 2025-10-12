import type { LibraryPanelStatusProps } from "./LibraryPanelStatus";

type StatusConfig = {
  loading: Pick<LibraryPanelStatusProps, "message" | "centered">;
  error?: Partial<LibraryPanelStatusProps> & { message: string };
  empty?: Partial<LibraryPanelStatusProps> & { message: string };
};

type ResolvePanelStatusArgs = {
  loading: boolean;
  error: Error | null;
  isEmpty: boolean;
  config: StatusConfig;
};

export function resolveLibraryPanelStatus({
  loading,
  error,
  isEmpty,
  config,
}: ResolvePanelStatusArgs): LibraryPanelStatusProps | null {
  if (loading) {
    const { message, centered = false } = config.loading;
    return {
      state: "loading",
      message,
      centered,
    };
  }

  if (error && config.error) {
    const { message, actionLabel, onAction, centered = false } = config.error;
    return {
      state: "error",
      message,
      actionLabel,
      onAction,
      centered,
    };
  }

  if (isEmpty && config.empty) {
    const { message, actionLabel, onAction, centered = false } = config.empty;
    return {
      state: "empty",
      message,
      actionLabel,
      onAction,
      centered,
    };
  }

  return null;
}
