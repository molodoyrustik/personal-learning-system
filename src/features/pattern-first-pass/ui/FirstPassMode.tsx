"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { PatternSentence } from "@/entities/pattern";
import { commitPracticeSessionAction } from "@/entities/pattern/api/pattern-actions";
import { getFirstPassQueue } from "@/shared/model/patterns-store";
import {
  SentencePracticeFlow,
  type SentenceResult,
} from "@/shared/ui/SentencePracticeFlow";

type FirstPassModeProps = {
  patternId: string;
  initialSentences: PatternSentence[];
  lessonId?: string;
  courseId?: string;
};

export function FirstPassMode({
  patternId,
  initialSentences,
  lessonId,
  courseId,
}: FirstPassModeProps) {
  const t = useTranslations("PatternModes");
  const sentences = useMemo(
    () => getFirstPassQueue(initialSentences, patternId),
    [initialSentences, patternId],
  );
  const backHref =
    lessonId && courseId
      ? `/patterns/${patternId}?lessonId=${lessonId}&courseId=${courseId}`
      : `/patterns/${patternId}`;

  function handleComplete(results: SentenceResult[]) {
    return commitPracticeSessionAction("first-pass", results);
  }

  return (
    <SentencePracticeFlow
      sentences={sentences}
      backHref={backHref}
      onComplete={handleComplete}
      emptyLabel={t("noNewSentences")}
      completeLabel={t("firstPassComplete")}
    />
  );
}
