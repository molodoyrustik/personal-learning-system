"use client";

import { Button, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Word } from "@/entities/word/model/types";
import {
  saveEncodingAction,
  setMeaningVisualizationAction,
  skipWordAction,
} from "@/entities/word/api/word-actions";
import { isInSlowEncodeQueue } from "@/shared/model/app-store";
import {
  StepFixation,
  StepImageCheck,
  StepSceneCreation,
  StepSoundEncoding,
} from "@/features/word-encoding/ui/encoding-steps";

type SlowEncodeModeProps = {
  listId: string;
  initialWords: Word[];
};

type Step = 1 | 2 | 3 | 4;

function CompletionState({ empty, onBack, onNext }: { empty?: boolean; onBack: () => void; onNext?: () => void }) {
  return (
    <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ minHeight: "60vh" }}>
      <Stack spacing={1} alignItems="center">
        <Typography variant="h2">
          {empty ? "Slow Encode queue is empty" : "Slow Encode complete"}
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          {empty
            ? "No words have reached Slow Encode yet."
            : "All difficult words have been processed."}
        </Typography>
      </Stack>
      <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 320 }}>
        {!empty && onNext && <Button variant="contained" fullWidth onClick={onNext}>→ Recall Mode</Button>}
        <Button variant="outlined" fullWidth onClick={onBack}>Back to list</Button>
      </Stack>
    </Stack>
  );
}

export function SlowEncodeMode({ listId, initialWords }: SlowEncodeModeProps) {
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

  async function handleHasImage() {
    if (!current) return;
    await setMeaningVisualizationAction(current.id, true);
    setStep(2);
  }

  async function handleImageSkip() {
    if (!current) return;
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
    setEncodedCount((n) => n + 1);
    moveToNext();
  }

  const router = useRouter();
  function goBack() { router.refresh(); router.push(`/lists/${listId}`); }
  function goToRecall() { router.refresh(); router.push(`/lists/${listId}/recall`); }

  if (total === 0 && doneCount === 0) return <CompletionState empty onBack={goBack} />;
  if (!current && doneCount > 0) return <CompletionState onBack={goBack} onNext={encodedCount > 0 ? goToRecall : undefined} />;

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button variant="text" size="small" sx={{ px: 0, minHeight: "auto" }} onClick={goBack}>
          ← Back
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
        Используй словарь для поиска подходящей ассоциации
      </Typography>

      {step === 1 && (
        <StepImageCheck
          word={current}
          hint="Попробуй ещё раз — без таймера"
          onHasImage={handleHasImage}
          onSkip={handleImageSkip}
        />
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
