export type LessonStatus = "todo" | "in-progress" | "done";

export type LessonProgress = { status: LessonStatus; dueCount: number };

export function computeLessonStatus(params: {
  wordTotal: number;
  wordNew: number;
  wordDone: number;
  sentenceTotal: number;
  sentenceNew: number;
  sentenceDone: number;
}): LessonStatus {
  const total = params.wordTotal + params.sentenceTotal;
  if (total === 0) return "todo";

  const newCount = params.wordNew + params.sentenceNew;
  if (newCount === total) return "todo";

  const doneCount = params.wordDone + params.sentenceDone;
  if (doneCount === total) return "done";

  return "in-progress";
}
