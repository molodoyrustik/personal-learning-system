"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { PatternSentence } from "@/entities/pattern";
import {
  markSentenceCorrectAction,
  markSentenceMistakeAction,
} from "@/entities/pattern/api/pattern-actions";
import { getFirstPassQueue } from "@/shared/model/patterns-store";
import { SentencePracticeFlow } from "@/shared/ui/SentencePracticeFlow";

type FirstPassModeProps = {
  patternId: string;
  initialSentences: PatternSentence[];
};

export function FirstPassMode({ patternId, initialSentences }: FirstPassModeProps) {
  const t = useTranslations("PatternModes");
  const sentences = useMemo(
    () => getFirstPassQueue(initialSentences, patternId),
    [initialSentences, patternId],
  );

  return (
    <SentencePracticeFlow
      sentences={sentences}
      backHref={`/patterns/${patternId}`}
      onCorrect={(id) => markSentenceCorrectAction(id, "first-pass")}
      onMistake={(id) => markSentenceMistakeAction(id)}
      emptyLabel={t("noNewSentences")}
      completeLabel={t("firstPassComplete")}
    />
  );
}
