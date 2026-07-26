import type { PatternSentence } from "@/entities/pattern";

// ---------------------------------------------------------------------------
// Practice mode — drives status transition rules in mark* actions
// ---------------------------------------------------------------------------

export type PracticeMode = "first-pass" | "review" | "full-practice";

// ---------------------------------------------------------------------------
// Queue selectors (pure — use these in components for initial queue and counts)
// ---------------------------------------------------------------------------

// First Pass: new sentences only
export function getFirstPassQueue(
  sentences: PatternSentence[],
  patternId: string,
): PatternSentence[] {
  return sentences.filter(
    (s) => s.patternId === patternId && s.status === "new",
  );
}

// Review Marked: marked sentences only
export function getMarkedQueue(
  sentences: PatternSentence[],
  patternId: string,
): PatternSentence[] {
  return sentences.filter(
    (s) => s.patternId === patternId && s.status === "marked",
  );
}

// Full Practice: the whole triaged set — 'learning' and 'known' alike, so it
// stays runnable any time you feel like it, even after everything has
// graduated. 'new' and 'marked' are excluded: those need First Pass / Review
// Marked first (and the mode is only unlocked once both are empty anyway).
export function getFullPracticeQueue(
  sentences: PatternSentence[],
  patternId: string,
): PatternSentence[] {
  return sentences.filter(
    (s) =>
      s.patternId === patternId &&
      (s.status === "learning" || s.status === "known"),
  );
}
