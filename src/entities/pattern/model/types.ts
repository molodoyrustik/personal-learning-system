export type Pattern = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

// 'new'       — not yet processed (First Pass queue)
// 'marked'    — needs extra work (Review Marked queue)
// 'learning'  — in active learned set (Full Practice queue)
// 'memorized' — graduated out of Full Practice, just got its first FSRS card
// 'reviewing' — has had at least one FSRS review (spaced Review queue)
// 'known'     — graduated out of Review for good (FSRS stability threshold)
export type SentenceStatus =
  | "new"
  | "marked"
  | "learning"
  | "memorized"
  | "reviewing"
  | "known";

// Mirrors ts-fsrs `State`: New=0, Learning=1, Review=2, Relearning=3.
// null until the sentence first reaches "memorized" and gets an FSRS card.
export type FsrsState = 0 | 1 | 2 | 3 | null;

// Rating passed to markSentenceReviewResultAction; mirrors ts-fsrs `Grade`
// (Rating.Again=1, Hard=2, Good=3, Easy=4 — Manual=0 is unused here).
export type ReviewRating = 1 | 2 | 3 | 4;

export type PatternSentence = {
  id: string;
  patternId: string;
  sourceText: string;
  targetText: string;
  comment: string | null;
  status: SentenceStatus;
  lastPracticedAt: string | null;
  nextReviewAt: string | null;

  // Correct answers accrued in Full Practice mode. Graduates to "memorized"
  // (first FSRS card) once it reaches TOTAL_FULL_PRACTICE_PASSES.
  fullPracticeSuccessCount: number;

  // FSRS card state, used from "memorized" onward (spaced Review mode).
  fsrsStability: number | null;
  fsrsDifficulty: number | null;
  fsrsState: FsrsState;
  fsrsReps: number;
  fsrsLapses: number;
  fsrsLearningSteps: number;

  createdAt: string;
  updatedAt: string;
};

// Recorded at the end of each Full Practice run.
export type PatternRun = {
  id: string;
  patternId: string;
  durationSec: number;
  completedAt: string;
};
