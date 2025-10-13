import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LibraryBook, LibraryResponse } from "../../api/library";
import { useLibraryBooks } from "./hooks/useLibraryBooks";
import { useLibrarySections } from "./hooks/useLibrarySections";
import { useLibraryEditor } from "./hooks/useLibraryEditor";

type LibraryDialogState =
  | { type: "book"; mode: "create" }
  | { type: "chapter"; mode: "create"; bookId: string }
  | { type: "chapter"; mode: "edit"; bookId: string; chapterId: string };

type BookEditorState = { bookId: string } | null;

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
  bookEditor: BookEditorState;
  openBookEditor: (bookId: string) => void;
  closeBookEditor: () => void;
  dialogState: LibraryDialogState | null;
  openCreateBookDialog: () => void;
  openCreateChapterDialog: (bookId: string) => void;
  openEditChapterDialog: (bookId: string, chapterId: string) => void;
  closeDialog: () => void;
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
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  useEffect(() => {
    if (books.length === 0) {
      setSelectedBookId(null);
      return;
    }

    setSelectedBookId((current) => {
      if (current && books.some((book) => book.id === current)) {
        return current;
      }
      return books[0].id;
    });
  }, [books]);

  const {
    sections,
    loading: sectionsLoading,
    error: sectionsError,
    reload: reloadSections,
  } = useLibrarySections(selectedBookId);

  const selectBook = useCallback((bookId: string) => {
    setSelectedBookId(bookId);
  }, []);

  const selectedBook = useMemo(
    () => books.find((book) => book.id === selectedBookId) ?? null,
    [books, selectedBookId],
  );

  const refreshLibrary = useCallback(() => {
    reloadBooks();
    if (selectedBookId) {
      reloadSections();
    }
  }, [reloadBooks, reloadSections, selectedBookId]);

  const { editorState, openEditor, closeEditor } = useLibraryEditor();

  const [dialogState, setDialogState] = useState<LibraryDialogState | null>(
    null,
  );
  const [bookEditor, setBookEditor] = useState<BookEditorState>(null);

  const openCreateBookDialog = useCallback(() => {
    setBookEditor(null);
    setDialogState({ type: "book", mode: "create" });
  }, []);

  const openBookEditor = useCallback(
    (bookId: string) => {
      setDialogState(null);
      setSelectedBookId(bookId);
      setBookEditor({ bookId });
    },
    [setSelectedBookId],
  );

  useEffect(() => {
    if (!bookEditor) {
      return;
    }
    if (!books.some((book) => book.id === bookEditor.bookId)) {
      setBookEditor(null);
    }
  }, [books, bookEditor]);

  const openCreateChapterDialog = useCallback((bookId: string) => {
    setDialogState({ type: "chapter", mode: "create", bookId });
  }, []);

  const openEditChapterDialog = useCallback(
    (bookId: string, chapterId: string) => {
      setDialogState({
        type: "chapter",
        mode: "edit",
        bookId,
        chapterId,
      });
    },
    [],
  );

  const closeDialog = useCallback(() => {
    setDialogState(null);
  }, []);

  const closeBookEditor = useCallback(() => {
    setBookEditor(null);
  }, []);

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
      bookEditor,
      openBookEditor,
      closeBookEditor,
      dialogState,
      openCreateBookDialog,
      openCreateChapterDialog,
      openEditChapterDialog,
      closeDialog,
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
      bookEditor,
      openBookEditor,
      closeBookEditor,
      dialogState,
      openCreateBookDialog,
      openCreateChapterDialog,
      openEditChapterDialog,
      closeDialog,
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
