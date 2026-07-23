import {
  type Card,
  type CardInput,
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
} from "ts-fsrs";

export { createEmptyCard, Rating, State };
export type { Card, CardInput };

// enable_short_term: false — each entity's own drilling phase (word Recall's
// 6 rounds, pattern's First Pass/Review Marked/Full Practice) already plays
// the role of FSRS's short-term learning steps, so Review can go straight
// into long-term interval scheduling from the very first pass (see
// LongTermScheduler in ts-fsrs: every rating, including Again, resolves to
// State.Review with a day-scale interval instead of a 1m/10m short step —
// a failed review just gets a shorter interval, not a full reset).
export const scheduler = fsrs(
  generatorParameters({ enable_short_term: false, enable_fuzz: true }),
);

// An item "graduates" out of Review once FSRS trusts it for ~2 months
// without prompting. Same threshold for words and pattern sentences.
export const KNOWN_STABILITY_DAYS = 60;

export type FsrsColumns = {
  fsrs_stability: number | null;
  fsrs_difficulty: number | null;
  fsrs_state: number | null;
  fsrs_reps: number | null;
  fsrs_lapses: number | null;
  fsrs_learning_steps: number | null;
  next_review_at: string | null;
};

export function buildCardInput(
  row: FsrsColumns,
  lastReview: string | null,
): CardInput {
  return {
    due: row.next_review_at ?? new Date(),
    stability: row.fsrs_stability ?? 0,
    difficulty: row.fsrs_difficulty ?? 0,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: row.fsrs_learning_steps ?? 0,
    reps: row.fsrs_reps ?? 0,
    lapses: row.fsrs_lapses ?? 0,
    state: row.fsrs_state ?? State.New,
    last_review: lastReview ?? undefined,
  };
}

export function fsrsColumnsFromCard(
  card: Card,
): Omit<FsrsColumns, "next_review_at"> {
  return {
    fsrs_stability: card.stability,
    fsrs_difficulty: card.difficulty,
    fsrs_state: card.state,
    fsrs_reps: card.reps,
    fsrs_lapses: card.lapses,
    fsrs_learning_steps: card.learning_steps,
  };
}

export function isGraduated(card: Card): boolean {
  return card.state === State.Review && card.stability >= KNOWN_STABILITY_DAYS;
}
