import { useCallback } from "react";
import type { Word } from "@/entities/word";
import { useAppStore } from "./AppStoreProvider";
import type { AppStore } from "./app-store";
import {
  isInSlowEncodeQueue,
  isInEncodingQueue,
  isInSkippedQueue,
} from "./app-store";

export const listsSelector = (state: AppStore) => state.lists;
export const wordsSelector = (state: AppStore) => state.words;
export const selectedListIdSelector = (state: AppStore) => state.selectedListId;

export function useAppStoreSelectors() {
  const lists = useAppStore(listsSelector);
  const words = useAppStore(wordsSelector);

  const getWordsByListId = useCallback(
    (listId: string) => words.filter((w) => w.listId === listId),
    [words],
  );

  return {
    lists,
    words,
    getWordsByListId,
  };
}

// --- Derived queues (list-scoped) ---

export function selectEncodingQueueWords(
  words: Word[],
  listId: string,
): Word[] {
  return words.filter((w) => w.listId === listId && isInEncodingQueue(w));
}

/** Skipped Mode: Pass 2 + Pass 3 timed queues only (not Slow Encode) */
export function selectSkippedTimedQueueWords(
  words: Word[],
  listId: string,
): Word[] {
  return words.filter((w) => w.listId === listId && isInSkippedQueue(w));
}

export function selectSlowEncodeQueueWords(
  words: Word[],
  listId: string,
): Word[] {
  return words.filter((w) => w.listId === listId && isInSlowEncodeQueue(w));
}
