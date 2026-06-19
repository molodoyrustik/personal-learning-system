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
  isInSkippedQueue,
} from "@/shared/model/app-store";
import {
  StepFixation,
  StepImageCheck,
  StepSceneCreation,
  StepSoundEncoding,
} from "@/features/word-encoding/ui/encoding-steps";

type SkippedModeProps = {
  listId: string;
  initialWords: Word[];
};

type Step = 1 | 2 | 3 | 4;

type Outcomes = { encoded: number; skippedAgain: number; sentToSlowEncode: number };

function CompletionState({ empty, outcomes, onBack, onGoToAgain, onGoToSlowEncode, onGoToRecall }: {
  empty?: boolean;
  outcomes: Outcomes;
  onBack: () => void;
  onGoToAgain: () => void;
  onGoToSlowEncode: () => void;
  onGoToRecall: () => void;
}) {
  const { encoded, skippedAgain, sentToSlowEncode } = outcomes;
  return (
    <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ minHeight: "60vh" }}>
      <Stack spacing={1} alignItems="center">
        <Typography variant="h2">{empty ? "No skipped words" : "Pass complete"}</Typography>
        {!empty && (
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {encoded > 0 && `${encoded} encoded`}
            {encoded > 0 && (skippedAgain > 0 || sentToSlowEncode > 0) && " · "}
            {skippedAgain > 0 && `${skippedAgain} need another pass`}
            {skippedAgain > 0 && sentToSlowEncode > 0 && " · "}
            {sentToSlowEncode > 0 && `${sentToSlowEncode} → Slow Encode`}
          </Typography>
        )}
      </Stack>
      <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 320 }}>
        {!empty && skippedAgain > 0 && (
          <Button variant="contained" fullWidth onClick={onGoToAgain}>→ Skipped again</Button>
        )}
        {!empty && sentToSlowEncode > 0 && (
          <Button variant={skippedAgain > 0 ? "outlined" : "contained"} fullWidth onClick={onGoToSlowEncode}>→ Slow Encode</Button>
        )}
        {!empty && encoded > 0 && skippedAgain === 0 && sentToSlowEncode === 0 && (
          <Button variant="contained" fullWidth onClick={onGoToRecall}>→ Recall Mode</Button>
        )}
        {empty && (
          <Button variant="contained" fullWidth onClick={onGoToSlowEncode}>→ Slow Encode</Button>
        )}
        <Button variant="outlined" fullWidth onClick={onBack}>Back to list</Button>
      </Stack>
    </Stack>
  );
}

export function SkippedMode({ listId, initialWords }: SkippedModeProps) {
  const [queue, setQueue] = useState<Word[]>(() =>
    initialWords.filter((w) => w.listId === listId && isInSkippedQueue(w)),
  );
  const [step, setStep] = useState<Step>(1);
  const [soundAssociation, setSoundAssociation] = useState("");
  const [sceneDescription, setSceneDescription] = useState("");
  const [doneCount, setDoneCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [outcomes, setOutcomes] = useState<Outcomes>({ encoded: 0, skippedAgain: 0, sentToSlowEncode: 0 });

  const current = queue[0] ?? null;
  const total = queue.length;

  const skipRef = useRef(skipWordAction);
  skipRef.current = skipWordAction;

  function trackEncoded() { setOutcomes((o) => ({ ...o, encoded: o.encoded + 1 })); }
  function trackSkip(word: Word) {
    // round 2 → 3 means it goes to Slow Encode; round 1 → 2 stays in skipped queue
    if (word.encodingAttemptRound === 2) {
      setOutcomes((o) => ({ ...o, sentToSlowEncode: o.sentToSlowEncode + 1 }));
    } else {
      setOutcomes((o) => ({ ...o, skippedAgain: o.skippedAgain + 1 }));
    }
  }
  const trackSkipRef = useRef(trackSkip);
  trackSkipRef.current = trackSkip;

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

  const currentRef = useRef(current);
  currentRef.current = current;

  useEffect(() => {
    if (!current) return;
    const sec = getEncodingTimeLimit(current) ?? 15;
    setSecondsLeft(sec);
    const tick = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    const t = setTimeout(() => {
      const w = currentRef.current;
      if (w) {
        skipRef.current(w.id);
        trackSkipRef.current(w);
      }
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

  async function handleImageSkip() {
    if (!current) return;
    await skipWordAction(current.id);
    trackSkip(current);
    moveToNext();
  }

  function handleSoundNext() {
    if (!soundAssociation.trim()) return;
    setStep(3);
  }

  async function handleSoundSkip() {
    if (!current) return;
    await skipWordAction(current.id);
    trackSkip(current);
    moveToNext();
  }

  function handleSceneSave() {
    if (!sceneDescription.trim()) return;
    setStep(4);
  }

  async function handleSceneSkip() {
    if (!current) return;
    await skipWordAction(current.id);
    trackSkip(current);
    moveToNext();
  }

  async function handleDone() {
    if (!current) return;
    await saveEncodingAction(current.id, {
      soundAssociation: soundAssociation.trim(),
      sceneDescription: sceneDescription.trim(),
    });
    trackEncoded();
    moveToNext();
  }

  const router = useRouter();
  function goBack() { router.refresh(); router.push(`/lists/${listId}`); }
  function goToAgain() { window.location.href = `/lists/${listId}/skipped`; }
  function goToSlowEncode() { router.refresh(); router.push(`/lists/${listId}/slow-encode`); }
  function goToRecall() { router.refresh(); router.push(`/lists/${listId}/recall`); }

  if (total === 0 && doneCount === 0) return <CompletionState empty outcomes={outcomes} onBack={goBack} onGoToAgain={goToAgain} onGoToSlowEncode={goToSlowEncode} onGoToRecall={goToRecall} />;
  if (!current && doneCount > 0) return <CompletionState outcomes={outcomes} onBack={goBack} onGoToAgain={goToAgain} onGoToSlowEncode={goToSlowEncode} onGoToRecall={goToRecall} />;

  const passUi = getTimedPassNumber(current) ?? 2;
  const limitSec = getEncodingTimeLimit(current) ?? 15;

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
        <StepImageCheck
          word={current}
          hint="Попробуй ещё раз"
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
