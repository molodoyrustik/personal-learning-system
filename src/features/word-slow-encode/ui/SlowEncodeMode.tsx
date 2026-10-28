"use client";

import { Button, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { List } from "@/entities/list";
import {
  commitEncodingResultsAction,
  type EncodingResult,
} from "@/entities/word/api/word-actions";
import type { Word } from "@/entities/word/model/types";
import {
  StepFixation,
  StepImageCheck,
  StepSceneCreation,
  StepSoundEncoding,
} from "@/features/word-encoding/ui/encoding-steps";
import { isInSlowEncodeQueue } from "@/shared/model/app-store";
import { STUDY_ACTION_BAR_OFFSET } from "@/shared/ui/StudyActionBar";
import { useSessionCommit } from "@/shared/lib/use-session-commit";
import { SessionSaveGate } from "@/shared/ui/SessionSaveGate";

type SlowEncodeModeProps = {
  list: List;
  initialWords: Word[];
};

type Step = 1 | 2 | 3 | 4;

function CompletionState({ empty, backHref, nextHref }: { empty?: boolean; backHref: string; nextHref?: string }) {
  const t = useTranslations("WordModes");
  return (
    <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ minHeight: "60vh" }}>
      <Stack spacing={1} alignItems="center">
        <Typography variant="h2">
          {empty ? t("slowEncodeEmpty") : t("slowEncodeComplete")}
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          {empty
            ? t("noWordsSlowEncode")
            : t("allDifficultProcessed")}
        </Typography>
      </Stack>
      <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 320 }}>
        {!empty && nextHref && <Button variant="contained" fullWidth component={Link} href={nextHref}>{t("toRecallMode")}</Button>}
        <Button variant="outlined" fullWidth component={Link} href={backHref}>{t("backToList")}</Button>
      </Stack>
    </Stack>
  );
}

export function SlowEncodeMode({ list, initialWords }: SlowEncodeModeProps) {
  const listId = list.id;
  const t = useTranslations("WordModes");
  const [queue, setQueue] = useState<Word[]>(() =>
    initialWords.filter((w) => isInSlowEncodeQueue(w)),
  );
  const [step, setStep] = useState<Step>(1);
  const [soundAssociation, setSoundAssociation] = useState("");
  const [sceneDescription, setSceneDescription] = useState("");
  const [doneCount, setDoneCount] = useState(0);
  const [encodedCount, setEncodedCount] = useState(0);

  const current = queue[0] ?? null;
  const total = queue.length;

  // Collected locally for the whole session — flushed to
  // commitEncodingResultsAction only once the queue is fully drained.
  // Quitting early (Back button, closing the tab) never persists anything.
  const resultsRef = useRef<EncodingResult[]>([]);
  const canVisualizeRef = useRef<boolean | undefined>(undefined);

  function resetInputs() {
    setSoundAssociation("");
    setSceneDescription("");
    setStep(1);
    canVisualizeRef.current = undefined;
  }

  function moveToNext() {
    setQueue((q) => q.slice(1));
    setDoneCount((n) => n + 1);
    resetInputs();
  }

  // Persist once the whole queue finishes (skip if queue was always empty)
  const save = useSessionCommit(
    () => commitEncodingResultsAction(resultsRef.current),
    doneCount > 0 && queue.length === 0,
  );

  function handleHasImage() {
    if (!current) return;
    canVisualizeRef.current = true;
    setStep(2);
  }

  function handleImageSkip() {
    if (!current) return;
    resultsRef.current.push({
      wordId: current.id,
      outcome: "skipped",
      canVisualizeMeaning: canVisualizeRef.current,
    });
    moveToNext();
  }

  function handleSoundNext() {
    setStep(3);
  }

  function handleSoundSkip() {
    if (!current) return;
    resultsRef.current.push({
      wordId: current.id,
      outcome: "skipped",
      canVisualizeMeaning: canVisualizeRef.current,
    });
    moveToNext();
  }

  function handleSceneSave() {
    setStep(4);
  }

  function handleSceneSkip() {
    if (!current) return;
    resultsRef.current.push({
      wordId: current.id,
      outcome: "skipped",
      canVisualizeMeaning: canVisualizeRef.current,
    });
    moveToNext();
  }

  function handleDone() {
    if (!current) return;
    resultsRef.current.push({
      wordId: current.id,
      outcome: "encoded",
      soundAssociation: soundAssociation.trim(),
      sceneDescription: sceneDescription.trim(),
      canVisualizeMeaning: canVisualizeRef.current,
    });
    setEncodedCount((n) => n + 1);
    moveToNext();
  }

  const backHref = `/lists/${listId}`;
  const recallHref = `/lists/${listId}/recall`;

  if (total === 0 && doneCount === 0) return <CompletionState empty backHref={backHref} />;
  if (!current && doneCount > 0) return <SessionSaveGate status={save.status} onRetry={save.retry}><CompletionState backHref={backHref} nextHref={encodedCount > 0 ? recallHref : undefined} /></SessionSaveGate>;

  return (
    <Stack spacing={3} sx={{ pb: STUDY_ACTION_BAR_OFFSET }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button variant="text" size="small" sx={{ px: 0, minHeight: "auto" }} component={Link} href={backHref}>
          {t("back")}
        </Button>
        <Stack alignItems="flex-end">
          <Typography variant="caption" color="text.secondary">
            {doneCount + 1} / {total}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Step {step} / 4
          </Typography>
        </Stack>
      </Stack>

      <Typography variant="body2" color="text.secondary" textAlign="center">
        {t("useDictionary")}
      </Typography>

      {step === 1 && (
        <StepImageCheck
          word={current}
          hint={t("tryAgainNoTimer")}
          onHasImage={handleHasImage}
          onSkip={handleImageSkip}
        />
      )}
      {step === 2 && (
        <StepSoundEncoding
          word={current}
          value={soundAssociation}
          targetLang={list.targetLanguage}
          onChange={setSoundAssociation}
          onNext={handleSoundNext}
          onSkip={handleSoundSkip}
        />
      )}
      {step === 3 && (
        <StepSceneCreation
          value={sceneDescription}
          onChange={setSceneDescription}
          onSave={handleSceneSave}
          onSkip={handleSceneSkip}
        />
      )}
      {step === 4 && (
        <StepFixation
          word={current}
          soundAssociation={soundAssociation}
          sceneDescription={sceneDescription}
          targetLang={list.targetLanguage}
          onDone={handleDone}
        />
      )}
    </Stack>
  );
}
