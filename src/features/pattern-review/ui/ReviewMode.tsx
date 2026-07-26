"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { PatternSentence } from "@/entities/pattern";
import { commitPracticeSessionAction } from "@/entities/pattern/api/pattern-actions";
import { getMarkedQueue } from "@/shared/model/patterns-store";
import {
  SentencePracticeFlow,
  type SentenceResult,
} from "@/shared/ui/SentencePracticeFlow";

type ReviewModeProps = {
  patternId: string;
  initialSentences: PatternSentence[];
  lessonId?: string;
  courseId?: string;
};

export function ReviewMode({
  patternId,
  initialSentences,
  lessonId,
  courseId,
}: ReviewModeProps) {
  const t = useTranslations("PatternModes");
  const sentences = useMemo(
    () => getMarkedQueue(initialSentences, patternId),
    [initialSentences, patternId],
  );
  const backHref =
    lessonId && courseId
      ? `/patterns/${patternId}?lessonId=${lessonId}&courseId=${courseId}`
      : `/patterns/${patternId}`;

  function handleComplete(results: SentenceResult[]) {
    return commitPracticeSessionAction("review", results);
  }

  return (
    <SentencePracticeFlow
      sentences={sentences}
      backHref={backHref}
      onComplete={handleComplete}
      emptyLabel={t("noMarkedSentences")}
      completeLabel={t("reviewComplete")}
      timed={false}
    />
  );
}
