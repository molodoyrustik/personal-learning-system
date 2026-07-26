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
import { STUDY_ACTION_BAR_OFFSET, StudyActionBar } from "@/shared/ui/StudyActionBar";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIMER_SEC = 5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Three distinct phases within a single sentence interaction:
//   prompt       — source sentence shown, countdown ticking, user thinking
//   answer-manual — user pressed "Show Answer" in time; they now choose Correct/Mistake
//   answer-auto  — timer fired; answer revealed automatically, sentence auto-marked
type Phase = "prompt" | "answer-manual" | "answer-auto";

export type SentenceResult = { sentenceId: string; correct: boolean };

export type SentencePracticeFlowProps = {
  sentences: PatternSentence[];
  backHref: string;
  // Called once, with every answer from the session, only after the whole
  // queue has been gone through. Quitting early (Back button, closing the
  // tab) never calls this — nothing is recorded for a partial pass.
  onComplete: (results: SentenceResult[]) => void | Promise<void>;
  // Shown when the queue was empty from the start
  emptyLabel: string;
  // Shown after processing the last sentence
  completeLabel: string;
  // When false, no countdown runs — user reveals the answer whenever ready.
  // Used by review-marked mode, where rushing defeats the point of reworking mistakes.
  timed?: boolean;
  // When false, skip the reveal step entirely: Correct/Mistake are available
  // immediately and the target text is never shown. Used by full-practice,
  // where the sentence is already learned and a self-judged mistake routes
  // back to review-marked mode instead of being checked against the answer here.
  revealAnswer?: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SentencePracticeFlow({
  sentences,
  backHref,
  onComplete,
  emptyLabel,
  completeLabel,
  timed = true,
  revealAnswer = true,
}: SentencePracticeFlowProps) {
  const t = useTranslations("PatternModes");
  const tCommon = useTranslations("Common");
  // Both the queue and the sentences map are snapshotted on mount, and stay
  // fixed for the whole session — nothing is persisted (and the parent's
  // `sentences` prop never changes) until onComplete fires at the very end.
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

  // Collected locally for the whole session — flushed to onComplete only
  // once the queue is fully drained. Not React state: recording an answer
  // must never trigger a render on its own, only moveToNext()'s state
  // updates should.
  const resultsRef = useRef<SentenceResult[]>([]);

  function record(correct: boolean) {
    if (!currentId) return;
    resultsRef.current.push({ sentenceId: currentId, correct });
  }

  // Keep callback ref current so timer closures never see a stale prop
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

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

  // Start a fresh countdown whenever the current sentence changes (if timed).
  // The effect cleanup cancels any previous timer, so there is no overlap.
  useEffect(() => {
    if (!currentId) return;

    setPhase("prompt");
    setSecondsLeft(TIMER_SEC);

    if (!timed) return;

    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    timerRef.current = setTimeout(() => {
      record(false);
      if (revealAnswer) {
        // Reveal the answer and wait for the user to click "Next"
        setPhase("answer-auto");
      } else {
        // No answer to reveal — move straight on
        moveToNext();
      }
    }, TIMER_SEC * 1000);

    return cancelTimer;
  }, [currentId, timed, revealAnswer]);

  // Notify parent when the whole queue finishes (skip if queue was always empty)
  useEffect(() => {
    if (doneCount > 0 && queue.length === 0) {
      onCompleteRef.current(resultsRef.current);
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
    record(true);
    moveToNext();
  }

  function handleMistake() {
    if (!currentId) return;
    cancelTimer();
    record(false);
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
  const isAnswerVisible =
    revealAnswer && (phase === "answer-manual" || phase === "answer-auto");

  // ---------------------------------------------------------------------------
  // Render: active session
  // ---------------------------------------------------------------------------

  return (
    <>
      <Stack spacing={3} sx={{ pb: STUDY_ACTION_BAR_OFFSET }}>
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
            {timed && phase === "prompt" && (
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
      </Stack>

      {/* Action buttons */}
      <StudyActionBar>
        {!revealAnswer && (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" fullWidth onClick={handleMistake}>
              {t("mistake")}
            </Button>
            <Button variant="contained" fullWidth onClick={handleCorrect}>
              {t("correct")}
            </Button>
          </Stack>
        )}

        {revealAnswer && phase === "prompt" && (
          <Button variant="contained" fullWidth onClick={handleShowAnswer}>
            {t("showAnswer")}
          </Button>
        )}

        {revealAnswer && phase === "answer-manual" && (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" fullWidth onClick={handleMistake}>
              {t("mistake")}
            </Button>
            <Button variant="contained" fullWidth onClick={handleCorrect}>
              {t("correct")}
            </Button>
          </Stack>
        )}

        {revealAnswer && phase === "answer-auto" && (
          <Button variant="outlined" fullWidth onClick={moveToNext}>
            {t("next")}
          </Button>
        )}
      </StudyActionBar>
    </>
  );
}
