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
import type { Word } from "@/entities/word/model/types";
import { markRecallResultAction } from "@/entities/word/api/word-actions";

type RecallModeProps = {
  listId: string;
  initialWords: Word[];
};

const RECALL_STATUSES = ["encoded", "learning", "weak"] as const;

export function RecallMode({ listId, initialWords }: RecallModeProps) {
  const t = useTranslations("WordModes");
  const [queue, setQueue] = useState<Word[]>(() =>
    initialWords.filter((w) =>
      (RECALL_STATUSES as readonly string[]).includes(w.status),
    ),
  );
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [memorizedCount, setMemorizedCount] = useState(0);
  const [stillLearningCount, setStillLearningCount] = useState(0);

  const router = useRouter();
  function goBack() { router.refresh(); router.push(`/lists/${listId}`); }

  const total = queue.length;
  const current = queue[0] ?? null;

  function moveToNext() {
    setQueue((q) => q.slice(1));
    setDoneCount((n) => n + 1);
    setIsAnswerVisible(false);
  }

  async function handleRemembered() {
    if (!current) return;
    await markRecallResultAction(current.id, true);
    if (current.recallSuccessCount + 1 >= 3) {
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
            <Button variant="contained" fullWidth onClick={() => { window.location.href = `/lists/${listId}/recall`; }}>
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
        <Typography variant="caption" color="text.secondary">
          {doneCount + 1} / {total}
        </Typography>
      </Stack>

      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack spacing={0.5} alignItems="center">
              <Typography variant="h1" textAlign="center">
                {current.sourceText}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {([t("round1"), t("round2"), t("round3")])[current.recallSuccessCount] ?? `${current.recallSuccessCount + 1} / 3`}
              </Typography>
            </Stack>
            {current.sceneDescription && (
              <>
                <Divider />
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">{t("scene")}</Typography>
                  <Typography variant="body1">{current.sceneDescription}</Typography>
                </Stack>
              </>
            )}
            {current.soundAssociation && (
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
                    {current.targetText}
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
