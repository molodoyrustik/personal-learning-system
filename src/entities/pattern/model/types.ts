export type Pattern = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

// 'new'      — not yet processed (First Pass queue)
// 'marked'   — needs extra work (Review Marked queue)
// 'learning' — in active learned set (Full Practice queue)
// 'known'    — graduated after TOTAL_FULL_PRACTICE_PASSES clean Full
//              Practice passes
export type SentenceStatus = "new" | "marked" | "learning" | "known";

export type PatternSentence = {
  id: string;
  patternId: string;
  sourceText: string;
  targetText: string;
  comment: string | null;
  status: SentenceStatus;
  lastPracticedAt: string | null;

  // Correct answers accrued in Full Practice mode. Graduates to "known"
  // once it reaches TOTAL_FULL_PRACTICE_PASSES.
  fullPracticeSuccessCount: number;

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
