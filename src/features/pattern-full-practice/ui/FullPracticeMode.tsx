"use client";

import { useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import type { PatternSentence } from "@/entities/pattern";
import {
  addFullRunAction,
  commitPracticeSessionAction,
} from "@/entities/pattern/api/pattern-actions";
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

  const sentences = useMemo(
    () => getFullPracticeQueue(initialSentences, patternId),
    [initialSentences, patternId],
  );
  const backHref =
    lessonId && courseId
      ? `/patterns/${patternId}?lessonId=${lessonId}&courseId=${courseId}`
      : `/patterns/${patternId}`;

  async function handleComplete(results: SentenceResult[]) {
    await commitPracticeSessionAction("full-practice", results);
    const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    await addFullRunAction(patternId, durationSec);
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
