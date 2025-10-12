import { useCallback } from "react";
import { useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";

type UseLibraryResourceOptions<TResult, TSelected> = {
  queryKey: QueryKey;
  queryFn: () => Promise<TResult>;
  select: (result: TResult) => TSelected;
  placeholderData: TSelected;
};

type UseLibraryResourceResult<TSelected> = {
  data: TSelected;
  loading: boolean;
  error: Error | null;
  reload: () => void;
};

export function useLibraryResource<TResult, TSelected>(
  options: UseLibraryResourceOptions<TResult, TSelected>,
): UseLibraryResourceResult<TSelected> {
  const { queryKey, queryFn, select, placeholderData } = options;
  const queryClient = useQueryClient();

  const query = useQuery<TResult, Error, TSelected>({
    queryKey,
    queryFn,
    select,
  });

  const reload = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    data: query.data ?? placeholderData,
    loading: query.isPending || query.isFetching,
    error: query.error ?? null,
    reload,
  };
}
