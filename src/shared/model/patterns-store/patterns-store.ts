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

// Full Practice: learning sentences only.
// 'marked' sentences are excluded — they belong to the dedicated Review Marked
// mode. This keeps modes clearly separated: you fix marked sentences first,
// then run the full timed set of 'learning' sentences.
export function getFullPracticeQueue(
  sentences: PatternSentence[],
  patternId: string,
): PatternSentence[] {
  return sentences.filter(
    (s) => s.patternId === patternId && s.status === "learning",
  );
}
