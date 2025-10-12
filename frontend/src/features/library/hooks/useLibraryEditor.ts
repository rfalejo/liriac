import { useCallback, useState } from "react";

type EditorState = {
  open: boolean;
  chapterId: string | null;
};

type UseLibraryEditorReturn = {
  editorState: EditorState;
  openEditor: (chapterId: string) => void;
  closeEditor: () => void;
};

const initialState: EditorState = { open: false, chapterId: null };

export function useLibraryEditor(): UseLibraryEditorReturn {
  const [editorState, setEditorState] = useState<EditorState>(initialState);

  const openEditor = useCallback((chapterId: string) => {
    setEditorState({ open: true, chapterId });
  }, []);

  const closeEditor = useCallback(() => {
    setEditorState((current) => ({ ...current, open: false }));
  }, []);

  return { editorState, openEditor, closeEditor };
}
