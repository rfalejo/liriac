import { useCallback, useEffect, useState } from "react";
import { fetchLibrarySections } from "../../api/library";
import type { ContextSection } from "../../api/library";

type LibraryState = {
  sections: ContextSection[];
  loading: boolean;
  error: Error | null;
};

export function useLibrarySections() {
  const [state, setState] = useState<LibraryState>(() => ({
    sections: [],
    loading: true,
    error: null,
  }));
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let isActive = true;

    setState((current) => ({ ...current, loading: true, error: null }));

    fetchLibrarySections()
      .then((response) => {
        if (!isActive) return;
        setState({ sections: response.sections, loading: false, error: null });
      })
      .catch((error: Error) => {
        if (!isActive) return;
        setState({ sections: [], loading: false, error });
      });

    return () => {
      isActive = false;
    };
  }, [refreshToken]);

  const reload = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  return {
    sections: state.sections,
    loading: state.loading,
    error: state.error,
    reload,
  };
}
