import { useCallback, useEffect, useState } from "react";
import { LibraryBook, fetchLibraryBooks } from "../../api/library";

type BooksState = {
  books: LibraryBook[];
  loading: boolean;
  error: Error | null;
};

export function useLibraryBooks() {
  const [state, setState] = useState<BooksState>(() => ({
    books: [],
    loading: true,
    error: null,
  }));
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let isActive = true;

    setState((current) => ({ ...current, loading: true, error: null }));

    fetchLibraryBooks()
      .then((response) => {
        if (!isActive) return;
        setState({ books: response.books, loading: false, error: null });
      })
      .catch((error: Error) => {
        if (!isActive) return;
        setState({ books: [], loading: false, error });
      });

    return () => {
      isActive = false;
    };
  }, [refreshToken]);

  const reload = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  return {
    books: state.books,
    loading: state.loading,
    error: state.error,
    reload,
  };
}
