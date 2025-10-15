function isNarrativeType(
  type: string | null | undefined,
): type is "paragraph" | "dialogue" {
  return type === "paragraph" || type === "dialogue";
}

export function getNarrativeBlockSpacing(
  previousType: string | null | undefined,
  currentType: string,
): number {
  if (!previousType) {
    return 0;
  }

  const previousIsNarrative = isNarrativeType(previousType);
  const currentIsNarrative = isNarrativeType(currentType);

  if (previousIsNarrative && currentIsNarrative) {
    return previousType === currentType ? 0.25 : 0.5;
  }

  return 1;
}
