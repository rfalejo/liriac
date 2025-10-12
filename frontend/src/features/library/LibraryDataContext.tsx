import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { LibraryBook, LibraryResponse } from "../../api/library";
import { useLibraryBooks } from "./useLibraryBooks";
import { useLibrarySections } from "./useLibrarySections";
import { useLibrarySelection } from "./useLibrarySelection";
import { useLibraryEditor } from "./useLibraryEditor";

type LibraryDataContextValue = {
  books: LibraryBook[];
  booksLoading: boolean;
  booksError: Error | null;
  reloadBooks: () => void;
  sections: LibraryResponse["sections"];
  sectionsLoading: boolean;
  sectionsError: Error | null;
  reloadSections: () => void;
  refreshLibrary: () => void;
  selectedBook: LibraryBook | null;
  selectedBookId: string | null;
  selectBook: (bookId: string) => void;
  editorState: ReturnType<typeof useLibraryEditor>["editorState"];
  openEditor: (chapterId: string) => void;
  closeEditor: () => void;
};

type LibraryDataContextProviderProps = {
  children: ReactNode;
};

const LibraryDataContext = createContext<LibraryDataContextValue | null>(null);

export function LibraryDataContextProvider({
  children,
}: LibraryDataContextProviderProps) {
  const {
    books,
    loading: booksLoading,
    error: booksError,
    reload: reloadBooks,
  } = useLibraryBooks();
  const {
    sections,
    loading: sectionsLoading,
    error: sectionsError,
    reload: reloadSections,
  } = useLibrarySections();

  const { refreshLibrary, selectBook, selectedBook, selectedBookId } =
    useLibrarySelection({
      books,
      reloadBooks,
      reloadSections,
    });

  const { editorState, openEditor, closeEditor } = useLibraryEditor();

  const value = useMemo<LibraryDataContextValue>(
    () => ({
      books,
      booksLoading,
      booksError,
      reloadBooks,
      sections,
      sectionsLoading,
      sectionsError,
      reloadSections,
      refreshLibrary,
      selectedBook,
      selectedBookId,
      selectBook,
      editorState,
      openEditor,
      closeEditor,
    }),
    [
      books,
      booksLoading,
      booksError,
      reloadBooks,
      sections,
      sectionsLoading,
      sectionsError,
      reloadSections,
      refreshLibrary,
      selectedBook,
      selectedBookId,
      selectBook,
  editorState,
  openEditor,
  closeEditor,
    ],
  );

  return (
    <LibraryDataContext.Provider value={value}>
      {children}
    </LibraryDataContext.Provider>
  );
}

export function useLibraryData() {
  const context = useContext(LibraryDataContext);

  if (!context) {
    throw new Error("useLibraryData must be used within LibraryDataProvider");
  }

  return context;
}
