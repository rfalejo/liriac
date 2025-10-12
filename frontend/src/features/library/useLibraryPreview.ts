import { useCallback, useState } from "react";

type PreviewState = {
  open: boolean;
  chapterId: string | null;
};

type UseLibraryPreviewReturn = {
  previewState: PreviewState;
  openPreview: (chapterId: string) => void;
  closePreview: () => void;
};

const initialState: PreviewState = { open: false, chapterId: null };

export function useLibraryPreview(): UseLibraryPreviewReturn {
  const [previewState, setPreviewState] = useState<PreviewState>(initialState);

  const openPreview = useCallback((chapterId: string) => {
    setPreviewState({ open: true, chapterId });
  }, []);

  const closePreview = useCallback(() => {
    setPreviewState((current) => ({ ...current, open: false }));
  }, []);

  return { previewState, openPreview, closePreview };
}
