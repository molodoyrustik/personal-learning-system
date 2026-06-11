import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import type { Pattern, PatternRun, PatternSentence } from "@/entities/pattern";
import { nowISO } from "@/shared/lib/date";
import { generateId } from "@/shared/lib/ids";

// ---------------------------------------------------------------------------
// Practice mode — drives status transition rules in mark* actions
// ---------------------------------------------------------------------------

export type PracticeMode = "first-pass" | "review" | "full-practice";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

type PatternsStoreState = {
  patterns: Pattern[];
  patternSentences: PatternSentence[];
  // Full Practice run history — one entry per completed full-list run
  patternRuns: PatternRun[];
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type PatternsStoreActions = {
  createPattern: (params: {
    name: string;
    description: string | null;
  }) => Pattern;
  updatePattern: (
    patternId: string,
    patch: Partial<Omit<Pattern, "id" | "createdAt">>,
  ) => void;
  deletePattern: (patternId: string) => void;

  addSentenceToPattern: (params: {
    patternId: string;
    sourceText: string;
    targetText: string;
    comment?: string | null;
  }) => PatternSentence;
  addSentencesBulk: (params: {
    patternId: string;
    sentences: { sourceText: string; targetText: string; comment?: string | null }[];
  }) => void;
  updateSentence: (
    sentenceId: string,
    patch: Partial<Omit<PatternSentence, "id" | "patternId" | "createdAt">>,
  ) => void;
  deleteSentence: (sentenceId: string) => void;

  // Status transition rules by mode:
  //   first-pass  correct  → learning
  //   review      correct  → learning
  //   full-practice correct → learning (no change, just updates lastPracticedAt)
  markSentenceCorrect: (sentenceId: string, mode: PracticeMode) => void;

  // All modes — mistake always moves sentence to 'marked'
  markSentenceMistake: (sentenceId: string, mode: PracticeMode) => void;

  // Record a completed Full Practice run
  addFullRun: (patternId: string, durationSec: number) => void;
};

export type PatternsStore = PatternsStoreState & PatternsStoreActions;
export type PatternsStoreApi = ReturnType<typeof createPatternsStore>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function patchSentence(
  sentences: PatternSentence[],
  id: string,
  patch: Partial<PatternSentence>,
): PatternSentence[] {
  return sentences.map((s) =>
    s.id === id ? { ...s, ...patch, updatedAt: nowISO() } : s,
  );
}

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

// ---------------------------------------------------------------------------
// Store factory
// ---------------------------------------------------------------------------

export function createPatternsStore() {
  return createStore<PatternsStore>()(
    persist(
      (set) => ({
        patterns: [],
        patternSentences: [],
        patternRuns: [],

        // --- Patterns ---

        createPattern: ({ name, description }) => {
          const now = nowISO();
          const pattern: Pattern = {
            id: generateId(),
            name,
            description,
            createdAt: now,
            updatedAt: now,
          };
          set((s) => ({ patterns: [...s.patterns, pattern] }));
          return pattern;
        },

        updatePattern: (patternId, patch) => {
          set((s) => ({
            patterns: s.patterns.map((p) =>
              p.id === patternId
                ? { ...p, ...patch, updatedAt: nowISO() }
                : p,
            ),
          }));
        },

        deletePattern: (patternId) => {
          set((s) => ({
            patterns: s.patterns.filter((p) => p.id !== patternId),
            patternSentences: s.patternSentences.filter(
              (sentence) => sentence.patternId !== patternId,
            ),
            patternRuns: s.patternRuns.filter(
              (run) => run.patternId !== patternId,
            ),
          }));
        },

        // --- Sentences ---

        addSentenceToPattern: ({ patternId, sourceText, targetText, comment }) => {
          const now = nowISO();
          const sentence: PatternSentence = {
            id: generateId(),
            patternId,
            sourceText,
            targetText,
            comment: comment ?? null,
            status: "new",
            lastPracticedAt: null,
            createdAt: now,
            updatedAt: now,
          };
          set((s) => ({ patternSentences: [...s.patternSentences, sentence] }));
          return sentence;
        },

        addSentencesBulk: ({ patternId, sentences }) => {
          const now = nowISO();
          const newSentences: PatternSentence[] = sentences.map(
            ({ sourceText, targetText, comment }) => ({
              id: generateId(),
              patternId,
              sourceText,
              targetText,
              comment: comment ?? null,
              status: "new",
              lastPracticedAt: null,
              createdAt: now,
              updatedAt: now,
            }),
          );
          set((s) => ({
            patternSentences: [...s.patternSentences, ...newSentences],
          }));
        },

        updateSentence: (sentenceId, patch) => {
          set((s) => ({
            patternSentences: patchSentence(s.patternSentences, sentenceId, patch),
          }));
        },

        deleteSentence: (sentenceId) => {
          set((s) => ({
            patternSentences: s.patternSentences.filter(
              (sentence) => sentence.id !== sentenceId,
            ),
          }));
        },

        // --- Practice results ---

        markSentenceCorrect: (sentenceId, mode) => {
          set((s) => {
            // Full Practice correct: sentence stays 'learning', only update timestamp.
            // First Pass / Review correct: advance to 'learning'.
            const patch: Partial<PatternSentence> =
              mode === "full-practice"
                ? { lastPracticedAt: nowISO() }
                : { status: "learning", lastPracticedAt: nowISO() };
            return {
              patternSentences: patchSentence(s.patternSentences, sentenceId, patch),
            };
          });
        },

        markSentenceMistake: (sentenceId, _mode) => {
          // All modes: move to 'marked' for targeted review
          set((s) => ({
            patternSentences: patchSentence(s.patternSentences, sentenceId, {
              status: "marked",
              lastPracticedAt: nowISO(),
            }),
          }));
        },

        // --- Run history ---

        addFullRun: (patternId, durationSec) => {
          const run: PatternRun = {
            id: generateId(),
            patternId,
            durationSec,
            completedAt: nowISO(),
          };
          set((s) => ({ patternRuns: [...s.patternRuns, run] }));
        },
      }),
      { name: "pls-patterns-store" },
    ),
  );
}
