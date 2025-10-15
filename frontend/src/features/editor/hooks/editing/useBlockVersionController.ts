import { useCallback, useEffect, useMemo } from "react";
import type { ChapterBlock } from "../../types";
import { useChapterBlockVersions } from "../useChapterBlockVersions";
import { useDeleteChapterBlockVersion } from "../useDeleteChapterBlockVersion";
import type { EditorEditingSideEffects } from "./types";
import type { ChapterDetail, ChapterBlockUpdatePayload } from "../../../../api/chapters";
import type { BlockVersionState } from "../../types";

type UseBlockVersionControllerParams = {
  block: ChapterBlock | null;
  chapterId: string | null;
  isActive: boolean;
  isSaving: boolean;
  updateBlock: (args: {
    blockId: string;
    payload: ChapterBlockUpdatePayload;
  }) => Promise<ChapterDetail>;
  sideEffects: Pick<EditorEditingSideEffects, "notifyUpdateFailure" | "confirmDeleteBlockVersion">;
};

export function useBlockVersionController({
  block,
  chapterId,
  isActive,
  isSaving,
  updateBlock,
  sideEffects,
}: UseBlockVersionControllerParams): BlockVersionState | undefined {
  const blockId = block?.id ?? null;
  const { notifyUpdateFailure, confirmDeleteBlockVersion } = sideEffects;

  const versionsQuery = useChapterBlockVersions({
    chapterId,
    blockId,
    enabled: isActive,
  });
  const { data, isLoading, isFetching, isFetched, refetch, error } = versionsQuery;

  useEffect(() => {
    if (!isActive || !error) {
      return;
    }
    notifyUpdateFailure(error);
  }, [error, isActive, notifyUpdateFailure]);

  const { deleteVersion, isPending: deletePending } = useDeleteChapterBlockVersion({
    chapterId,
    blockId,
  });

  useEffect(() => {
    if (!isActive || !block) {
      return;
    }
    if (!isFetched) {
      return;
    }
    void refetch({ throwOnError: false });
  }, [block?.versionCount, block?.activeVersion, isActive, isFetched, refetch]);

  const availableVersions = useMemo(() => {
    if (data?.versions) {
      return [...data.versions]
        .map((entry) => entry.version)
        .sort((a, b) => a - b);
    }

    if (block?.versionCount) {
      return Array.from({ length: block.versionCount }, (_, index) => index + 1);
    }

    return [] as number[];
  }, [block?.versionCount, data?.versions]);

  const currentVersion = block?.activeVersion ?? null;
  const totalVersions = block?.versionCount ?? availableVersions.length;

  const getSiblingVersion = useCallback(
    (direction: "previous" | "next") => {
      if (!currentVersion) {
        return null;
      }

      const ordered = availableVersions.length > 0 ? availableVersions : [currentVersion];
      if (direction === "previous") {
        for (let index = ordered.length - 1; index >= 0; index -= 1) {
          const candidate = ordered[index];
          if (candidate < currentVersion) {
            return candidate;
          }
        }
        return currentVersion > 1 ? currentVersion - 1 : null;
      }

      for (let index = 0; index < ordered.length; index += 1) {
        const candidate = ordered[index];
        if (candidate > currentVersion) {
          return candidate;
        }
      }
      return totalVersions > currentVersion ? currentVersion + 1 : null;
    },
    [availableVersions, currentVersion, totalVersions],
  );

  const navigateToVersion = useCallback(
    async (targetVersion: number | null) => {
      if (!blockId || !targetVersion || targetVersion === currentVersion) {
        return;
      }

      try {
        await updateBlock({
          blockId,
          payload: { version: targetVersion },
        });
        if (chapterId && blockId) {
          await refetch({ throwOnError: false });
        }
      } catch (error) {
        notifyUpdateFailure(error);
      }
    },
    [blockId, chapterId, currentVersion, notifyUpdateFailure, refetch, updateBlock],
  );

  const handlePrevious = useCallback(() => {
    const target = getSiblingVersion("previous");
    void navigateToVersion(target);
  }, [getSiblingVersion, navigateToVersion]);

  const handleNext = useCallback(() => {
    const target = getSiblingVersion("next");
    void navigateToVersion(target);
  }, [getSiblingVersion, navigateToVersion]);

  const handleDeleteVersion = useCallback(async () => {
    if (!blockId || !currentVersion) {
      return;
    }

    if (totalVersions <= 1) {
      return;
    }

  const confirmed = await confirmDeleteBlockVersion();
    if (!confirmed) {
      return;
    }

    try {
      await deleteVersion(currentVersion);
      await refetch({ throwOnError: false });
    } catch (error) {
      notifyUpdateFailure(error);
    }
  }, [blockId, confirmDeleteBlockVersion, currentVersion, deleteVersion, notifyUpdateFailure, refetch, totalVersions]);

  if (!blockId || !chapterId || !currentVersion) {
    return undefined;
  }

  const canDelete = totalVersions > 1;
  const isBusy = isSaving || deletePending || isLoading;
  const previousVersion = getSiblingVersion("previous");
  const nextVersion = getSiblingVersion("next");

  return {
    current: currentVersion,
    total: totalVersions,
    canGoPrevious: Boolean(previousVersion),
    canGoNext: Boolean(nextVersion),
    onPrevious: handlePrevious,
    onNext: handleNext,
    onDelete: canDelete ? handleDeleteVersion : undefined,
    deleteDisabled: isBusy || totalVersions <= 1,
    disabled: isBusy,
    loading: isLoading || isFetching,
  };
}
