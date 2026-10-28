"use client";

import {
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { List } from "@/entities/list";
import type { Word } from "@/entities/word/model/types";
import { commitRecallMistakesResultsAction } from "@/entities/word/api/word-actions";
import { PronounceButton } from "@/shared/ui/PronounceButton";
import { STUDY_ACTION_BAR_OFFSET, StudyActionBar } from "@/shared/ui/StudyActionBar";
import { useSessionCommit } from "@/shared/lib/use-session-commit";
import { SessionSaveGate } from "@/shared/ui/SessionSaveGate";

const TOTAL_ROUNDS = 6;

type RecallMistakesModeProps = {
  list: List;
  initialWords: Word[];
};

export function RecallMistakesMode({ list, initialWords }: RecallMistakesModeProps) {
  const t = useTranslations("WordModes");

  const [queue, setQueue] = useState<Word[]>(() =>
    initialWords.filter((w) => w.status === "marked"),
  );
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  // Collected locally for the whole session — flushed to
  // commitRecallMistakesResultsAction only once the queue is fully drained.
  // Quitting early (Back button, closing the tab) never persists anything.
  const resultsRef = useRef<{ wordId: string; remembered: boolean }[]>([]);

  const backHref = `/lists/${list.id}`;

  const total = queue.length;
  const current = queue[0] ?? null;

  const isForward = current ? current.recallSuccessCount % 2 === 0 : true;
  const prompt = current ? (isForward ? current.sourceText : current.targetText) : "";
  const answer = current ? (isForward ? current.targetText : current.sourceText) : "";
  const fromLang = isForward ? list.sourceLanguage.toUpperCase() : list.targetLanguage.toUpperCase();
  const toLang = isForward ? list.targetLanguage.toUpperCase() : list.sourceLanguage.toUpperCase();
  const currentRound = current ? current.recallSuccessCount + 1 : 0;

  // Persist once the whole queue finishes (skip if queue was always empty)
  const save = useSessionCommit(
    () => commitRecallMistakesResultsAction(resultsRef.current),
    doneCount > 0 && queue.length === 0,
  );

  function moveToNext() {
    setQueue((q) => q.slice(1));
    setDoneCount((n) => n + 1);
    setIsAnswerVisible(false);
  }

  function handleRemembered() {
    if (!current) return;
    resultsRef.current.push({ wordId: current.id, remembered: true });
    moveToNext();
  }

  function handleForgot() {
    if (!current) return;
    resultsRef.current.push({ wordId: current.id, remembered: false });
    moveToNext();
  }

  if (total === 0 && doneCount === 0) {
    return (
      <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ minHeight: "60vh" }}>
        <Stack spacing={1} alignItems="center">
          <Typography variant="h2">{t("nothingToRecall")}</Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {t("noMarkedWords")}
          </Typography>
        </Stack>
        <Button variant="outlined" component={Link} href={backHref}>{t("backToList")}</Button>
      </Stack>
    );
  }

  if (!current && doneCount > 0) {
    return (
      <SessionSaveGate status={save.status} onRetry={save.retry}>
        <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ minHeight: "60vh" }}>
          <Stack spacing={1} alignItems="center">
            <Typography variant="h2">{t("passComplete")}</Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              {t("recallMistakesComplete")}
            </Typography>
          </Stack>
          <Button variant="outlined" component={Link} href={backHref}>{t("backToList")}</Button>
        </Stack>
      </SessionSaveGate>
    );
  }

  return (
    <>
      <Stack spacing={3} sx={{ pb: STUDY_ACTION_BAR_OFFSET }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Button variant="text" size="small" sx={{ px: 0, minHeight: "auto" }} component={Link} href={backHref}>
            {t("back")}
          </Button>
          <Stack alignItems="flex-end" spacing={0}>
            <Typography variant="caption" color="text.secondary">
              {doneCount + 1} / {total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {fromLang} → {toLang} · {t("roundOf", { current: currentRound, total: TOTAL_ROUNDS })}
            </Typography>
          </Stack>
        </Stack>

        <Card>
          <CardContent>
            <Stack spacing={2.5}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                <Typography variant="h1" textAlign="center">
                  {prompt}
                </Typography>
                {!isForward && (
                  <PronounceButton text={prompt} lang={list.targetLanguage} />
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {t("whatIsThisWord")}
              </Typography>
              {isAnswerVisible && (
                <>
                  <Divider />
                  <Stack alignItems="center" sx={{ py: 1 }}>
                    <Typography variant="h2" color="primary">
                      {answer}
                    </Typography>
                  </Stack>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <StudyActionBar>
        {!isAnswerVisible ? (
          <Button variant="contained" fullWidth onClick={() => setIsAnswerVisible(true)}>
            {t("showAnswer")}
          </Button>
        ) : (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" fullWidth onClick={handleForgot}>
              {t("didntRemember")}
            </Button>
            <Button variant="contained" fullWidth onClick={handleRemembered}>
              {t("remembered")}
            </Button>
          </Stack>
        )}
      </StudyActionBar>
    </>
  );
}
