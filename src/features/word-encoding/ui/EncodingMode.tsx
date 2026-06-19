"use client";

import { Button, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Word } from "@/entities/word/model/types";
import {
  saveEncodingAction,
  setMeaningVisualizationAction,
  skipWordAction,
} from "@/entities/word/api/word-actions";
import {
  getEncodingTimeLimit,
  getTimedPassNumber,
} from "@/shared/model/app-store";
import {
  StepFixation,
  StepImageCheck,
  StepSceneCreation,
  StepSoundEncoding,
} from "./encoding-steps";

type EncodingModeProps = {
  listId: string;
  initialWords: Word[];
};

type Step = 1 | 2 | 3 | 4;

function CompletionState({ empty, onBack }: { empty?: boolean; onBack: () => void }) {
  return (
    <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ minHeight: "60vh" }}>
      <Stack spacing={1} alignItems="center">
        <Typography variant="h2">
          {empty ? "Nothing to encode" : "Encoding complete"}
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          {empty
            ? "There are no selected words in this list."
            : "All selected words have been processed."}
        </Typography>
      </Stack>
      <Button variant="outlined" onClick={onBack}>Back to list</Button>
    </Stack>
  );
}

export function EncodingMode({ listId, initialWords }: EncodingModeProps) {
  const [queue, setQueue] = useState<Word[]>(() =>
    initialWords.filter((w) => w.status === "selected"),
  );
  const [step, setStep] = useState<Step>(1);
  const [soundAssociation, setSoundAssociation] = useState("");
  const [sceneDescription, setSceneDescription] = useState("");
  const [doneCount, setDoneCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(10);

  const current = queue[0] ?? null;
  const total = queue.length;

  const skipRef = useRef(skipWordAction);
  skipRef.current = skipWordAction;

  function resetInputs() {
    setSoundAssociation("");
    setSceneDescription("");
    setStep(1);
  }

  function moveToNext() {
    setQueue((q) => q.slice(1));
    setDoneCount((n) => n + 1);
    resetInputs();
  }

  const moveToNextRef = useRef(moveToNext);
  moveToNextRef.current = moveToNext;

  useEffect(() => {
    if (!current) return;
    const sec = getEncodingTimeLimit(current) ?? 10;
    setSecondsLeft(sec);
    const tick = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    const t = setTimeout(() => {
      skipRef.current(current.id);
      moveToNextRef.current();
    }, sec * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(t);
    };
  }, [current?.id]);

  async function handleHasImage() {
    if (!current) return;
    await setMeaningVisualizationAction(current.id, true);
    setStep(2);
  }

  async function handleNoImage() {
    if (!current) return;
    await setMeaningVisualizationAction(current.id, false);
    await skipWordAction(current.id);
    moveToNext();
  }

  function handleSoundNext() {
    if (!soundAssociation.trim()) return;
    setStep(3);
  }

  async function handleSoundSkip() {
    if (!current) return;
    await skipWordAction(current.id);
    moveToNext();
  }

  function handleSceneSave() {
    if (!sceneDescription.trim()) return;
    setStep(4);
  }

  async function handleSceneSkip() {
    if (!current) return;
    await skipWordAction(current.id);
    moveToNext();
  }

  async function handleDone() {
    if (!current) return;
    await saveEncodingAction(current.id, {
      soundAssociation: soundAssociation.trim(),
      sceneDescription: sceneDescription.trim(),
    });
    moveToNext();
  }

  const router = useRouter();
  function goBack() { router.refresh(); router.push(`/lists/${listId}`); }

  if (total === 0) return <CompletionState empty onBack={goBack} />;
  if (!current) return <CompletionState onBack={goBack} />;

  const passUi = getTimedPassNumber(current) ?? 1;
  const limitSec = getEncodingTimeLimit(current) ?? 10;

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button variant="text" size="small" sx={{ px: 0, minHeight: "auto" }} onClick={goBack}>
          ← Back
        </Button>
        <Stack alignItems="flex-end" spacing={0.25}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Pass {passUi} — {limitSec}s{secondsLeft > 0 ? ` · ${secondsLeft}s` : ""}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {doneCount + 1} / {total}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Step {step} / 4
          </Typography>
        </Stack>
      </Stack>

      {step === 1 && (
        <StepImageCheck word={current} onHasImage={handleHasImage} onSkip={handleNoImage} />
      )}
      {step === 2 && (
        <StepSoundEncoding
          word={current}
          value={soundAssociation}
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
          onDone={handleDone}
        />
      )}
    </Stack>
  );
}
