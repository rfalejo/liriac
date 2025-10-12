import type { DialogueTurn } from "../types";

export function generateTurnId(): string {
  const cryptoRef =
    typeof globalThis !== "undefined"
      ? (globalThis.crypto as Crypto | undefined)
      : undefined;
  if (cryptoRef && "randomUUID" in cryptoRef) {
    return cryptoRef.randomUUID();
  }
  return `local-turn-${Math.random().toString(36).slice(2, 10)}`;
}

export function cloneTurns(turns: DialogueTurn[] | undefined): DialogueTurn[] {
  if (!turns?.length) {
    return [];
  }
  return turns.map((turn) => ({
    id: turn.id ?? generateTurnId(),
    speakerId: turn.speakerId ?? null,
    speakerName: turn.speakerName ?? "",
    utterance: turn.utterance ?? "",
    stageDirection: turn.stageDirection ?? null,
    tone: turn.tone ?? null,
  }));
}

export function equalTurns(a: DialogueTurn[], b: DialogueTurn[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let index = 0; index < a.length; index += 1) {
    const left = a[index];
    const right = b[index];
    if ((left.id ?? "") !== (right.id ?? "")) {
      return false;
    }
    if ((left.speakerName ?? "") !== (right.speakerName ?? "")) {
      return false;
    }
    if ((left.utterance ?? "") !== (right.utterance ?? "")) {
      return false;
    }
    if ((left.stageDirection ?? "") !== (right.stageDirection ?? "")) {
      return false;
    }
    if ((left.speakerId ?? "") !== (right.speakerId ?? "")) {
      return false;
    }
    if ((left.tone ?? "") !== (right.tone ?? "")) {
      return false;
    }
  }
  return true;
}

export function createEmptyTurn(): DialogueTurn {
  return {
    id: generateTurnId(),
    speakerId: null,
    speakerName: "",
    utterance: "",
    stageDirection: null,
    tone: null,
  };
}
