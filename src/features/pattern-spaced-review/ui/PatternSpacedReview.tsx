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
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { PatternSentence, ReviewRating } from "@/entities/pattern";
import { markSentenceReviewResultAction } from "@/entities/pattern/api/pattern-actions";

// Mirrors ts-fsrs `Rating` (Again/Hard/Good/Easy) without importing the
// library into the client bundle — the numbers are the contract.
const AGAIN: ReviewRating = 1;
const HARD: ReviewRating = 2;
const GOOD: ReviewRating = 3;
const EASY: ReviewRating = 4;

type PatternSpacedReviewProps = {
  patternId: string;
  initialSentences: PatternSentence[];
};

export function PatternSpacedReview({
  patternId,
  initialSentences,
}: PatternSpacedReviewProps) {
  const router = useRouter();
  const t = useTranslations("PatternModes");
  const [queue, setQueue] = useState<PatternSentence[]>(initialSentences);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  const total = initialSentences.length;
  const current = queue[0] ?? null;

  function goBack() {
    router.refresh();
    router.push(`/patterns/${patternId}`);
  }

  function moveToNext() {
    setQueue((q) => q.slice(1));
    setDoneCount((n) => n + 1);
    setIsAnswerVisible(false);
  }

  async function handleRate(rating: ReviewRating) {
    if (!current) return;
    await markSentenceReviewResultAction(current.id, rating);
    moveToNext();
  }

  if (total === 0) {
    return (
      <Stack
        spacing={3}
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: "60vh" }}
      >
        <Stack spacing={1} alignItems="center">
          <Typography variant="h2">{t("noSentencesToReview")}</Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {t("allCaughtUp")}
          </Typography>
        </Stack>
        <Button variant="outlined" onClick={goBack}>
          {t("backToPattern")}
        </Button>
      </Stack>
    );
  }

  if (!current) {
    return (
      <Stack
        spacing={3}
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: "60vh" }}
      >
        <Stack spacing={1} alignItems="center">
          <Typography variant="h2">{t("reviewSessionComplete")}</Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {t("youReviewedSentences", {
              count: doneCount,
              unit: doneCount === 1 ? t("sentenceUnit") : t("sentencesUnit"),
            })}
          </Typography>
        </Stack>
        <Button variant="outlined" onClick={goBack}>
          {t("backToPattern")}
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h1">{t("dailyReview")}</Typography>
        <Typography variant="caption" color="text.secondary">
          {doneCount + 1} / {total}
        </Typography>
      </Stack>

      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack spacing={0.5} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {t("translateToEnglish")}
              </Typography>
              <Typography variant="h1" textAlign="center">
                {current.sourceText}
              </Typography>
            </Stack>

            {isAnswerVisible && (
              <>
                <Divider />
                <Stack spacing={0.5} alignItems="center">
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

      {!isAnswerVisible ? (
        <Button
          variant="contained"
          fullWidth
          onClick={() => setIsAnswerVisible(true)}
        >
          {t("showAnswer")}
        </Button>
      ) : (
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            color="error"
            fullWidth
            onClick={() => handleRate(AGAIN)}
          >
            {t("rateAgain")}
          </Button>
          <Button
            variant="outlined"
            color="warning"
            fullWidth
            onClick={() => handleRate(HARD)}
          >
            {t("rateHard")}
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={() => handleRate(GOOD)}
          >
            {t("rateGood")}
          </Button>
          <Button
            variant="outlined"
            color="success"
            fullWidth
            onClick={() => handleRate(EASY)}
          >
            {t("rateEasy")}
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
