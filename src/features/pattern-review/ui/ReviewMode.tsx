"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { PatternSentence } from "@/entities/pattern";
import {
  markSentenceCorrectAction,
  markSentenceMistakeAction,
} from "@/entities/pattern/api/pattern-actions";
import { getMarkedQueue } from "@/shared/model/patterns-store";
import { SentencePracticeFlow } from "@/shared/ui/SentencePracticeFlow";

type ReviewModeProps = {
  patternId: string;
  initialSentences: PatternSentence[];
};

export function ReviewMode({ patternId, initialSentences }: ReviewModeProps) {
  const t = useTranslations("PatternModes");
  const sentences = useMemo(
    () => getMarkedQueue(initialSentences, patternId),
    [initialSentences, patternId],
  );

  return (
    <SentencePracticeFlow
      sentences={sentences}
      backHref={`/patterns/${patternId}`}
      onCorrect={(id) => markSentenceCorrectAction(id, "review")}
      onMistake={(id) => markSentenceMistakeAction(id)}
      emptyLabel={t("noMarkedSentences")}
      completeLabel={t("reviewComplete")}
    />
  );
}
