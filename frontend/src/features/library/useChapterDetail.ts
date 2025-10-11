import { useCallback, useEffect, useRef, useState } from "react";
import { ChapterDetail, fetchChapterDetail } from "../../api/chapters";

type ChapterDetailState = {
  chapter: ChapterDetail | null;
  loading: boolean;
  error: Error | null;
};

type CacheMap = Map<string, ChapterDetail>;

export function useChapterDetail(chapterId: string | null | undefined) {
  const [state, setState] = useState<ChapterDetailState>(() => ({
    chapter: null,
    loading: false,
    error: null,
  }));
  const [refreshToken, setRefreshToken] = useState(0);
  const cacheRef = useRef<CacheMap>(new Map());

  useEffect(() => {
    if (!chapterId) {
      setState({ chapter: null, loading: false, error: null });
      return;
    }

    const cachedChapter = cacheRef.current.get(chapterId) ?? null;

    setState({
      chapter: cachedChapter,
      loading: cachedChapter === null,
      error: null,
    });

    let isActive = true;

    fetchChapterDetail(chapterId)
      .then((chapter) => {
        if (!isActive) return;
        cacheRef.current.set(chapterId, chapter);
        setState({ chapter, loading: false, error: null });
      })
      .catch((error: Error) => {
        if (!isActive) return;
        setState((current) => ({
          chapter: current.chapter,
          loading: false,
          error,
        }));
      });

    return () => {
      isActive = false;
    };
  }, [chapterId, refreshToken]);

  const reload = useCallback(() => {
    if (!chapterId) return;
    cacheRef.current.delete(chapterId);
    setRefreshToken((value) => value + 1);
  }, [chapterId]);

  return {
    chapter: state.chapter,
    loading: state.loading,
    error: state.error,
    reload,
  };
}
