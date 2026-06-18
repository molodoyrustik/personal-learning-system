export type WordStatus =
  | "new"
  | "selected"
  | "rejected"
  | "skipped"
  | "encoded"
  | "learning"
  | "weak"
  | "mastered";

export type SelectionDecision =
  | "unknown_and_needed"
  | "already_known"
  | "not_needed"
  | null;

// Last completed encoding pass for this word (anti-baran rounds).
// null = still on Pass 1 (encoding queue / not yet completed a pass)
// 1–3  = after skip or successful encode from the corresponding tier
export type EncodingAttemptRound = 1 | 2 | 3 | null;

export type Word = {
  id: string;
  listId: string;

  sourceText: string;
  targetText: string;

  status: WordStatus;
  selectionDecision: SelectionDecision;
  canVisualizeMeaning: boolean | null;
  soundAssociation: string | null;
  sceneDescription: string | null;
  skipCount: number;
  encodingAttemptCount: number;
  encodingAttemptRound: EncodingAttemptRound;
  recallSuccessCount: number;
  recallFailCount: number;
  lastRecalledAt: string | null;
  nextReviewAt: string | null;
  createdAt: string;
  updatedAt: string;
};
