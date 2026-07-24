import type { Word } from "@/entities/word";

// ---------------------------------------------------------------------------
// Derived queue helpers (used in components via word.status / word.encodingAttemptRound)
// ---------------------------------------------------------------------------

// Encoding queue (Pass 1): selected words, 10s timer in UI
export function isInEncodingQueue(word: Word): boolean {
  return word.status === "selected";
}

// Skipped queue (Pass 2 & 3): timed retries — round 1 → 15s, round 2 → 25s
export function isInSkippedQueue(word: Word): boolean {
  return word.status === "skipped" && word.encodingAttemptRound !== 3;
}

// Slow Encode queue: words skipped through all 3 passes — no timer
export function isInSlowEncodeQueue(word: Word): boolean {
  return word.status === "skipped" && word.encodingAttemptRound === 3;
}
