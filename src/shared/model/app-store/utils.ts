import type { LanguageCode, List } from "@/entities/list";
import type { EncodingAttemptRound, Word } from "@/entities/word";
import { nowISO } from "@/shared/lib/date";
import { generateId } from "@/shared/lib/ids";

export function patchWord(
  words: Word[],
  wordId: string,
  patch: Partial<Word>,
): Word[] {
  return words.map((w) =>
    w.id === wordId ? { ...w, ...patch, updatedAt: nowISO() } : w,
  );
}

export function makeWord(params: {
  listId: string;
  sourceText: string;
  targetText: string;
}): Word {
  const now = nowISO();
  return {
    id: generateId(),
    listId: params.listId,
    sourceText: params.sourceText,
    targetText: params.targetText,
    status: "new",
    selectionDecision: null,
    canVisualizeMeaning: null,
    soundAssociation: null,
    sceneDescription: null,
    skipCount: 0,
    encodingAttemptCount: 0,
    encodingAttemptRound: null,
    recallSuccessCount: 0,
    recallFailCount: 0,
    lastRecalledAt: null,
    nextReviewAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function makeList(params: {
  name: string;
  description: string | null;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
}): List {
  const now = nowISO();
  return {
    id: generateId(),
    name: params.name,
    description: params.description,
    sourceLanguage: params.sourceLanguage,
    targetLanguage: params.targetLanguage,
    createdAt: now,
    updatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Encoding pass helpers
// ---------------------------------------------------------------------------

// Timed pass limits (seconds) by `encodingAttemptRound` (last completed pass):
//   null → Pass 1 (encoding queue) → 10s
//   1    → Pass 2 (skipped retry)  → 15s
//   2    → Pass 3 (skipped retry)  → 25s
//   3    → Slow Encode queue       → no timer (null)
export function getEncodingTimeLimit(word: Word): number | null {
  // Persisted words may have undefined before this field existed — treat like null
  const r = word.encodingAttemptRound;
  if (r == null) return 10;
  if (r === 1) return 15;
  if (r === 2) return 25;
  if (r === 3) return null;
  return 10;
}

/** UI pass label (1–3) for the timed flow; Slow Encode uses Pass 4 without timer in copy only */
export function getTimedPassNumber(word: Word): 1 | 2 | 3 | null {
  if (word.status === "selected") return 1;
  if (word.status === "skipped" && word.encodingAttemptRound === 1) return 2;
  if (word.status === "skipped" && word.encodingAttemptRound === 2) return 3;
  return null;
}

// Advance round on skip: null/undefined→1, 1→2, 2→3, 3→3 (cap at 3)
export function nextEncodingRound(current: EncodingAttemptRound): 1 | 2 | 3 {
  if (current == null) return 1;
  if (current === 1) return 2;
  if (current === 2) return 3;
  return 3;
}
