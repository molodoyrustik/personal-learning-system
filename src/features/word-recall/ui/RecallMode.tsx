"use client";

import {
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { List } from "@/entities/list";
import type { Word } from "@/entities/word/model/types";
import { markRecallResultAction } from "@/entities/word/api/word-actions";
import { PronounceButton } from "@/shared/ui/PronounceButton";

const TOTAL_ROUNDS = 6;
const RECALL_STATUSES = ["encoded", "learning", "weak"] as const;

type RecallModeProps = {
  list: List;
  initialWords: Word[];
};

export function RecallMode({ list, initialWords }: RecallModeProps) {
  const t = useTranslations("WordModes");
  const router = useRouter();

  const [queue, setQueue] = useState<Word[]>(() =>
    initialWords.filter((w) =>
      (RECALL_STATUSES as readonly string[]).includes(w.status),
    ),
  );
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [memorizedCount, setMemorizedCount] = useState(0);
  const [stillLearningCount, setStillLearningCount] = useState(0);

  function goBack() { router.refresh(); router.push(`/lists/${list.id}`); }

  const total = queue.length;
  const current = queue[0] ?? null;

  // Even round (0,2,4): source → target. Odd round (1,3,5): target → source.
  const isForward = current ? current.recallSuccessCount % 2 === 0 : true;
  const prompt = current ? (isForward ? current.sourceText : current.targetText) : "";
  const answer = current ? (isForward ? current.targetText : current.sourceText) : "";
  const fromLang = isForward ? list.sourceLanguage.toUpperCase() : list.targetLanguage.toUpperCase();
  const toLang = isForward ? list.targetLanguage.toUpperCase() : list.sourceLanguage.toUpperCase();
  const currentRound = current ? current.recallSuccessCount + 1 : 0;

  function moveToNext() {
    setQueue((q) => q.slice(1));
    setDoneCount((n) => n + 1);
    setIsAnswerVisible(false);
  }

  async function handleRemembered() {
    if (!current) return;
    await markRecallResultAction(current.id, true);
    if (current.recallSuccessCount + 1 >= TOTAL_ROUNDS) {
      setMemorizedCount((n) => n + 1);
    } else {
      setStillLearningCount((n) => n + 1);
    }
    moveToNext();
  }

  async function handleForgot() {
    if (!current) return;
    await markRecallResultAction(current.id, false);
    setStillLearningCount((n) => n + 1);
    moveToNext();
  }

  if (total === 0 && doneCount === 0) {
    return (
      <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ minHeight: "60vh" }}>
        <Stack spacing={1} alignItems="center">
          <Typography variant="h2">{t("nothingToRecall")}</Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {t("noWordsReadyForRecall")}
          </Typography>
        </Stack>
        <Button variant="outlined" onClick={goBack}>{t("backToList")}</Button>
      </Stack>
    );
  }

  if (!current && doneCount > 0) {
    return (
      <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ minHeight: "60vh" }}>
        <Stack spacing={1} alignItems="center">
          <Typography variant="h2">{t("passComplete")}</Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {memorizedCount > 0 && `${memorizedCount} ${t("memorized")}`}
            {memorizedCount > 0 && stillLearningCount > 0 && " · "}
            {stillLearningCount > 0 && `${stillLearningCount} ${t("stillLearning")}`}
          </Typography>
        </Stack>
        <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 320 }}>
          {stillLearningCount > 0 && (
            <Button variant="contained" fullWidth onClick={() => { window.location.href = `/lists/${list.id}/recall`; }}>
              {t("toRecallAgain")}
            </Button>
          )}
          <Button variant="outlined" fullWidth onClick={goBack}>{t("backToList")}</Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button variant="text" size="small" sx={{ px: 0, minHeight: "auto" }} onClick={goBack}>
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
            {isForward && current?.sceneDescription && (
              <>
                <Divider />
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">{t("scene")}</Typography>
                  <Typography variant="body1">{current.sceneDescription}</Typography>
                </Stack>
              </>
            )}
            {isForward && current?.soundAssociation && (
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">{t("association")}</Typography>
                <Typography variant="body1">{current.soundAssociation}</Typography>
              </Stack>
            )}
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

      {!isAnswerVisible ? (
        <Button variant="contained" fullWidth onClick={() => setIsAnswerVisible(true)}>
          {t("showAnswer")}
        </Button>
      ) : (
        <Stack spacing={1.5}>
          <Button variant="contained" fullWidth onClick={handleRemembered}>
            {t("remembered")}
          </Button>
          <Button variant="outlined" fullWidth onClick={handleForgot}>
            {t("didntRemember")}
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
