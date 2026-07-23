export type WordStatus =
  | "new"
  | "selected"
  | "rejected"
  | "skipped"
  | "encoded"
  | "learning"
  | "weak"
  | "memorized"
  | "reviewing"
  | "known";

export type SelectionDecision =
  | "unknown_and_needed"
  | "already_known"
  | "not_needed"
  | null;

// Last completed encoding pass for this word (anti-baran rounds).
// null = still on Pass 1 (encoding queue / not yet completed a pass)
// 1–3  = after skip or successful encode from the corresponding tier
export type EncodingAttemptRound = 1 | 2 | 3 | null;

// Mirrors ts-fsrs `State`: New=0, Learning=1, Review=2, Relearning=3.
// null until the word first reaches "memorized" and gets an FSRS card.
export type FsrsState = 0 | 1 | 2 | 3 | null;

// Rating passed to markReviewResultAction; mirrors ts-fsrs `Grade`
// (Rating.Again=1, Hard=2, Good=3, Easy=4 — Manual=0 is unused here).
export type ReviewRating = 1 | 2 | 3 | 4;

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

  // FSRS card state, used from "memorized" onward (Review mode).
  fsrsStability: number | null;
  fsrsDifficulty: number | null;
  fsrsState: FsrsState;
  fsrsReps: number;
  fsrsLapses: number;
  fsrsLearningSteps: number;

  createdAt: string;
  updatedAt: string;
};
