"use client";

import { useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import type { PatternSentence } from "@/entities/pattern";
import {
  addFullRunAction,
  commitPracticeSessionAction,
} from "@/entities/pattern/api/pattern-actions";
import { generateId } from "@/shared/lib/ids";
import { getFullPracticeQueue } from "@/shared/model/patterns-store";
import {
  SentencePracticeFlow,
  type SentenceResult,
} from "@/shared/ui/SentencePracticeFlow";

type FullPracticeModeProps = {
  patternId: string;
  initialSentences: PatternSentence[];
  lessonId?: string;
  courseId?: string;
};

export function FullPracticeMode({
  patternId,
  initialSentences,
  lessonId,
  courseId,
}: FullPracticeModeProps) {
  const t = useTranslations("PatternModes");
  const startTimeRef = useRef(Date.now());
  const runIdRef = useRef<string | null>(null);
  const durationSecRef = useRef<number | null>(null);

  const sentences = useMemo(
    () => getFullPracticeQueue(initialSentences, patternId),
    [initialSentences, patternId],
  );
  const backHref =
    lessonId && courseId
      ? `/patterns/${patternId}?lessonId=${lessonId}&courseId=${courseId}`
      : `/patterns/${patternId}`;

  // Run first: it's idempotent by runId, while the session commit is not —
  // so a retry after a failure in either step never double-applies anything.
  async function handleComplete(results: SentenceResult[]) {
    runIdRef.current ??= generateId();
    durationSecRef.current ??= Math.round(
      (Date.now() - startTimeRef.current) / 1000,
    );
    await addFullRunAction(runIdRef.current, patternId, durationSecRef.current);
    await commitPracticeSessionAction("full-practice", results);
  }

  return (
    <SentencePracticeFlow
      sentences={sentences}
      backHref={backHref}
      onComplete={handleComplete}
      emptyLabel={t("noLearningSentences")}
      completeLabel={t("fullRunRecorded")}
      revealAnswer={false}
    />
  );
}
