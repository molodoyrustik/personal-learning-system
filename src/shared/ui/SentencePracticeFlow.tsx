"use client";

import {
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { PatternSentence } from "@/entities/pattern";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIMER_SEC = 3;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Three distinct phases within a single sentence interaction:
//   prompt       — source sentence shown, countdown ticking, user thinking
//   answer-manual — user pressed "Show Answer" in time; they now choose Correct/Mistake
//   answer-auto  — timer fired; answer revealed automatically, sentence auto-marked
type Phase = "prompt" | "answer-manual" | "answer-auto";

export type SentencePracticeFlowProps = {
  sentences: PatternSentence[];
  backHref: string;
  // Called when user manually confirms correct (not on auto-timeout)
  onCorrect: (sentenceId: string) => void;
  // Called both on auto-timeout AND when user manually marks a mistake
  onMistake: (sentenceId: string) => void;
  // Called once when the entire queue has been processed
  onSessionComplete?: () => void;
  // Shown when the queue was empty from the start
  emptyLabel: string;
  // Shown after processing the last sentence
  completeLabel: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SentencePracticeFlow({
  sentences,
  backHref,
  onCorrect,
  onMistake,
  onSessionComplete,
  emptyLabel,
  completeLabel,
}: SentencePracticeFlowProps) {
  const t = useTranslations("PatternModes");
  const tCommon = useTranslations("Common");
  // Both the queue and the sentences map are snapshotted on mount.
  // When onMistake fires the store changes the sentence status, which removes
  // it from the parent's filtered `sentences` prop — if we rebuilt the map
  // from the prop on every render, current would become null mid-session and
  // the UI would disappear. The snapshot keeps sentence data stable for the
  // entire session regardless of store updates.
  const router = useRouter();

  const [queue, setQueue] = useState<string[]>(() => sentences.map((s) => s.id));
  const [sentencesMap] = useState(
    () => new Map(sentences.map((s) => [s.id, s])),
  );
  const [phase, setPhase] = useState<Phase>("prompt");
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SEC);
  const [doneCount, setDoneCount] = useState(0);

  const currentId = queue[0] ?? null;
  const current = currentId ? (sentencesMap.get(currentId) ?? null) : null;

  // Keep callback refs current so timer closures never see stale props
  const onMistakeRef = useRef(onMistake);
  onMistakeRef.current = onMistake;
  const onCorrectRef = useRef(onCorrect);
  onCorrectRef.current = onCorrect;
  const onSessionCompleteRef = useRef(onSessionComplete);
  onSessionCompleteRef.current = onSessionComplete;

  // Timer handle refs — stored in refs so cancelTimer() works from any handler
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function cancelTimer() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (tickRef.current !== null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  // Start a fresh 3-second countdown whenever the current sentence changes.
  // The effect cleanup cancels any previous timer, so there is no overlap.
  useEffect(() => {
    if (!currentId) return;

    setPhase("prompt");
    setSecondsLeft(TIMER_SEC);

    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    timerRef.current = setTimeout(() => {
      // Auto-timeout: mark as mistake, reveal answer, show "Next" button
      onMistakeRef.current(currentId);
      setPhase("answer-auto");
    }, TIMER_SEC * 1000);

    return cancelTimer;
  }, [currentId]);

  // Notify parent when the whole queue finishes (skip if queue was always empty)
  useEffect(() => {
    if (doneCount > 0 && queue.length === 0) {
      onSessionCompleteRef.current?.();
    }
  }, [doneCount, queue.length]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleShowAnswer() {
    // Cancel timer immediately — no double-processing after manual reveal
    cancelTimer();
    setPhase("answer-manual");
  }

  function moveToNext() {
    setQueue((q) => q.slice(1));
    setDoneCount((n) => n + 1);
  }

  function handleCorrect() {
    if (!currentId) return;
    cancelTimer(); // safety: already cancelled if answer-manual, but guard anyway
    onCorrectRef.current(currentId);
    moveToNext();
  }

  function handleMistake() {
    if (!currentId) return;
    cancelTimer();
    onMistakeRef.current(currentId);
    moveToNext();
  }

  // ---------------------------------------------------------------------------
  // Render: empty state (queue started empty)
  // ---------------------------------------------------------------------------

  function handleBack() {
    cancelTimer();
    router.refresh();
    router.push(backHref);
  }

  if (queue.length === 0 && doneCount === 0) {
    return (
      <Stack
        spacing={3}
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: "60vh" }}
      >
        <Stack spacing={1} alignItems="center">
          <Typography variant="h2">{t("nothingHere")}</Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {emptyLabel}
          </Typography>
        </Stack>
        <Button variant="outlined" onClick={handleBack}>{tCommon("back")}</Button>
      </Stack>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: completion state (all sentences processed)
  // ---------------------------------------------------------------------------

  if (queue.length === 0) {
    return (
      <Stack
        spacing={3}
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: "60vh" }}
      >
        <Stack spacing={1} alignItems="center">
          <Typography variant="h2">{t("reviewComplete")}</Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {completeLabel}
          </Typography>
        </Stack>
        <Button variant="outlined" onClick={handleBack}>{tCommon("back")}</Button>
      </Stack>
    );
  }

  if (!current) return null;

  const total = queue.length + doneCount;
  const isAnswerVisible = phase === "answer-manual" || phase === "answer-auto";

  // ---------------------------------------------------------------------------
  // Render: active session
  // ---------------------------------------------------------------------------

  return (
    <Stack spacing={3}>
      {/* Header row */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button
          variant="text"
          size="small"
          sx={{ px: 0, minHeight: "auto" }}
          onClick={handleBack}
        >
          {tCommon("back")}
        </Button>
        <Stack alignItems="flex-end" spacing={0.25}>
          {phase === "prompt" && (
            <Chip
              label={`${secondsLeft}s`}
              size="small"
              color={secondsLeft <= 1 ? "error" : "default"}
              variant="outlined"
            />
          )}
          <Typography variant="caption" color="text.secondary">
            {doneCount + 1} / {total}
          </Typography>
        </Stack>
      </Stack>

      {/* Sentence card */}
      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            {/* Source (RU) */}
            <Stack spacing={0.5} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {t("translateToEnglish")}
              </Typography>
              <Typography variant="h1" textAlign="center">
                {current.sourceText}
              </Typography>
            </Stack>

            {/* Answer (revealed after timer or manual Show Answer) */}
            {isAnswerVisible && (
              <>
                <Divider />
                <Stack spacing={0.5} alignItems="center">
                  {phase === "answer-auto" && (
                    <Typography variant="caption" color="error">
                      {t("timeIsUp")}
                    </Typography>
                  )}
                  <Typography variant="h2" color="primary" textAlign="center">
                    {current.targetText}
                  </Typography>
                  {current.comment && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign="center"
                      sx={{ mt: 0.5 }}
                    >
                      {current.comment}
                    </Typography>
                  )}
                </Stack>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Action buttons */}
      {phase === "prompt" && (
        <Button variant="contained" fullWidth onClick={handleShowAnswer}>
          {t("showAnswer")}
        </Button>
      )}

      {phase === "answer-manual" && (
        <Stack spacing={1.5}>
          <Button variant="contained" fullWidth onClick={handleCorrect}>
            {t("correct")}
          </Button>
          <Button variant="outlined" fullWidth onClick={handleMistake}>
            {t("mistake")}
          </Button>
        </Stack>
      )}

      {phase === "answer-auto" && (
        <Button variant="outlined" fullWidth onClick={moveToNext}>
          {t("next")}
        </Button>
      )}
    </Stack>
  );
}
