"use client";

import { useMemo, useRef } from "react";
import type { PatternSentence } from "@/entities/pattern";
import {
  addFullRunAction,
  markSentenceCorrectAction,
  markSentenceMistakeAction,
} from "@/entities/pattern/api/pattern-actions";
import { getFullPracticeQueue } from "@/shared/model/patterns-store";
import { SentencePracticeFlow } from "@/shared/ui/SentencePracticeFlow";

type FullPracticeModeProps = {
  patternId: string;
  initialSentences: PatternSentence[];
};

export function FullPracticeMode({ patternId, initialSentences }: FullPracticeModeProps) {
  const startTimeRef = useRef(Date.now());

  const sentences = useMemo(
    () => getFullPracticeQueue(initialSentences, patternId),
    [initialSentences, patternId],
  );

  function handleSessionComplete() {
    const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    addFullRunAction(patternId, durationSec);
  }

  return (
    <SentencePracticeFlow
      sentences={sentences}
      backHref={`/patterns/${patternId}`}
      onCorrect={(id) => markSentenceCorrectAction(id, "full-practice")}
      onMistake={(id) => markSentenceMistakeAction(id)}
      onSessionComplete={handleSessionComplete}
      emptyLabel="No learning sentences yet. Complete First Pass first."
      completeLabel="Full run recorded. Check your progress below."
    />
  );
}
