import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import type { LanguageCode, List } from "@/entities/list";
import type { SelectionDecision, Word } from "@/entities/word";
import { nowISO } from "@/shared/lib/date";

import { makeList, makeWord, nextEncodingRound, patchWord } from "./utils";

const STORE_VERSION = 2;

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

type AppStoreState = {
  lists: List[];
  words: Word[];
  selectedListId: string | null;
};

function migratePersistedState(persisted: unknown): AppStoreState {
  if (!persisted || typeof persisted !== "object") {
    return { lists: [], words: [], selectedListId: null };
  }
  const p = persisted as Record<string, unknown>;
  const listsIn = p.lists;
  const wordsIn = p.words;
  if (!Array.isArray(listsIn) || !Array.isArray(wordsIn)) {
    return { lists: [], words: [], selectedListId: null };
  }

  const lists: List[] = listsIn.map((item) => {
    const l = item as Record<string, unknown>;
    return {
      id: String(l.id),
      name: String(l.name),
      description: l.description == null ? null : String(l.description),
      sourceLanguage: (l.sourceLanguage === "en" ? "en" : "ru") as LanguageCode,
      targetLanguage: (l.targetLanguage === "ru" ? "ru" : "en") as LanguageCode,
      createdAt: String(l.createdAt),
      updatedAt: String(l.updatedAt),
    };
  });

  const words: Word[] = wordsIn.map((item) => {
    const w = { ...(item as Record<string, unknown>) };
    const hasNew =
      typeof w.sourceText === "string" && typeof w.targetText === "string";
    const sourceText = hasNew ? String(w.sourceText) : String(w.ru ?? "");
    const targetText = hasNew ? String(w.targetText) : String(w.en ?? "");
    delete w.ru;
    delete w.en;
    return { ...w, sourceText, targetText } as Word;
  });

  return {
    lists,
    words,
    selectedListId: (p.selectedListId as string | null) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type AppStoreActions = {
  setSelectedListId: (listId: string | null) => void;

  createList: (params: {
    name: string;
    description: string | null;
    sourceLanguage: LanguageCode;
    targetLanguage: LanguageCode;
  }) => List;
  updateList: (
    listId: string,
    patch: Partial<Omit<List, "id" | "createdAt">>,
  ) => void;

  addWordToList: (params: {
    listId: string;
    sourceText: string;
    targetText: string;
  }) => Word;
  addWordsToList: (params: {
    listId: string;
    words: { sourceText: string; targetText: string }[];
  }) => void;
  updateWord: (
    wordId: string,
    patch: Partial<Omit<Word, "id" | "listId" | "createdAt">>,
  ) => void;

  selectWord: (wordId: string) => void;
  rejectWord: (
    wordId: string,
    reason: Exclude<SelectionDecision, "unknown_and_needed" | null>,
  ) => void;

  setMeaningVisualization: (
    wordId: string,
    canVisualizeMeaning: boolean,
  ) => void;

  saveEncoding: (
    wordId: string,
    params: { soundAssociation: string; sceneDescription: string },
  ) => void;
  skipWord: (wordId: string) => void;

  markRecallResult: (wordId: string, remembered: boolean) => void;

  resetStore: () => void;
};

export type AppStore = AppStoreState & AppStoreActions;

export function createAppStore() {
  return createStore<AppStore>()(
    persist(
      (set) => ({
        lists: [],
        words: [],
        selectedListId: null,

        // --- Navigation ---

        setSelectedListId: (listId) => set({ selectedListId: listId }),

        // --- Lists ---

        createList: ({ name, description, sourceLanguage, targetLanguage }) => {
          const list: List = makeList({
            name,
            description,
            sourceLanguage,
            targetLanguage,
          });
          set((s) => ({ lists: [...s.lists, list] }));
          return list;
        },

        updateList: (listId, patch) => {
          set((s) => ({
            lists: s.lists.map((l) =>
              l.id === listId ? { ...l, ...patch, updatedAt: nowISO() } : l,
            ),
          }));
        },

        // --- Words ---

        addWordToList: ({ listId, sourceText, targetText }) => {
          const word = makeWord({ listId, sourceText, targetText });
          set((s) => ({ words: [...s.words, word] }));
          return word;
        },

        addWordsToList: ({ listId, words }) => {
          const newWords = words.map(({ sourceText, targetText }) =>
            makeWord({ listId, sourceText, targetText }),
          );
          set((s) => ({ words: [...s.words, ...newWords] }));
        },

        updateWord: (wordId, patch) => {
          set((s) => ({ words: patchWord(s.words, wordId, patch) }));
        },

        // --- Selection ---

        selectWord: (wordId) => {
          set((s) => ({
            words: patchWord(s.words, wordId, {
              status: "selected",
              selectionDecision: "unknown_and_needed",
            }),
          }));
        },

        rejectWord: (wordId, reason) => {
          set((s) => ({
            words: patchWord(s.words, wordId, {
              status: "rejected",
              selectionDecision: reason,
            }),
          }));
        },

        // --- Meaning visualization ---

        setMeaningVisualization: (wordId, canVisualizeMeaning) => {
          set((s) => ({
            words: patchWord(s.words, wordId, { canVisualizeMeaning }),
          }));
        },

        // --- Encoding ---

        saveEncoding: (wordId, { soundAssociation, sceneDescription }) => {
          set((s) => {
            const word = s.words.find((w) => w.id === wordId);
            if (!word) return s;
            const r = word.encodingAttemptRound;
            const encodingAttemptRound =
              r == null ? 1 : r === 1 ? 2 : r === 2 ? 3 : 3;
            return {
              words: patchWord(s.words, wordId, {
                soundAssociation,
                sceneDescription,
                status: "encoded",
                encodingAttemptCount: word.encodingAttemptCount + 1,
                encodingAttemptRound,
              }),
            };
          });
        },

        // Skip advances encodingAttemptRound:
        //   null → 1 (will appear in timed pass 2: 15s)
        //   1    → 2 (will appear in timed pass 3: 25s)
        //   2    → 3 (will appear in dictionary queue, no timer)
        //   3    → 3 (stays in dictionary queue)
        skipWord: (wordId) => {
          set((s) => {
            const word = s.words.find((w) => w.id === wordId);
            if (!word) return s;
            return {
              words: patchWord(s.words, wordId, {
                status: "skipped",
                skipCount: word.skipCount + 1,
                encodingAttemptCount: word.encodingAttemptCount + 1,
                encodingAttemptRound: nextEncodingRound(
                  word.encodingAttemptRound,
                ),
              }),
            };
          });
        },

        // --- Recall ---

        markRecallResult: (wordId, remembered) => {
          set((s) => {
            const word = s.words.find((w) => w.id === wordId);
            if (!word) return s;

            if (remembered) {
              const recallSuccessCount = word.recallSuccessCount + 1;
              const status = recallSuccessCount >= 3 ? "mastered" : "learning";
              return {
                words: patchWord(s.words, wordId, {
                  recallSuccessCount,
                  status,
                  lastRecalledAt: nowISO(),
                }),
              };
            } else {
              const recallFailCount = word.recallFailCount + 1;
              const status = recallFailCount >= 2 ? "weak" : "learning";
              return {
                words: patchWord(s.words, wordId, {
                  recallFailCount,
                  status,
                  lastRecalledAt: nowISO(),
                }),
              };
            }
          });
        },

        resetStore: () => set({ lists: [], words: [], selectedListId: null }),
      }),
      {
        name: "pls-store",
        version: STORE_VERSION,
        migrate: (persistedState, version) => {
          if (version >= STORE_VERSION) {
            return persistedState as AppStoreState;
          }
          return migratePersistedState(persistedState);
        },
      },
    ),
  );
}

export type AppStoreApi = ReturnType<typeof createAppStore>;

// ---------------------------------------------------------------------------
// Derived queue helpers (used in components via state.words)
// ---------------------------------------------------------------------------

// Encoding queue (Pass 1): selected words, 10s timer in UI
export function isInEncodingQueue(word: Word): boolean {
  return word.status === "selected";
}

// Skipped queue (Pass 2 & 3): timed retries — round 1 → 15s, round 2 → 25s
export function isInSkippedQueue(word: Word): boolean {
  return word.status === "skipped" && word.encodingAttemptRound !== 3;
}

// Dictionary queue: words skipped through all 3 passes — no timer
export function isInDictionaryQueue(word: Word): boolean {
  return word.status === "skipped" && word.encodingAttemptRound === 3;
}
