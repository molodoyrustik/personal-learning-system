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
import type { ReviewRating } from "@/entities/word";
import { markReviewResultAction } from "@/entities/word/api/word-actions";
import { STUDY_ACTION_BAR_OFFSET, StudyActionBar } from "@/shared/ui/StudyActionBar";

// Mirrors ts-fsrs `Rating` (Again/Hard/Good/Easy) without importing the
// library into the client bundle — the numbers are the contract.
const AGAIN: ReviewRating = 1;
const HARD: ReviewRating = 2;
const GOOD: ReviewRating = 3;
const EASY: ReviewRating = 4;

type ReviewWord = {
  id: string;
  source_text: string;
  target_text: string;
  sound_association: string | null;
  scene_description: string | null;
  next_review_at: string | null;
};

type DailyReviewProps = {
  listId: string;
  initialWords: ReviewWord[];
};

export function DailyReview({ listId, initialWords }: DailyReviewProps) {
  const router = useRouter();
  const t = useTranslations("WordModes");
  const [queue, setQueue] = useState<ReviewWord[]>(initialWords);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  const total = initialWords.length;
  const current = queue[0] ?? null;

  function moveToNext() {
    setQueue((q) => q.slice(1));
    setDoneCount((n) => n + 1);
    setIsAnswerVisible(false);
  }

  async function handleRate(rating: ReviewRating) {
    if (!current) return;
    await markReviewResultAction(current.id, rating);
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
          <Typography variant="h2">{t("noWordsToReview")}</Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {t("allCaughtUp")}
          </Typography>
        </Stack>
        <Button
          variant="outlined"
          onClick={() => {
            router.refresh();
            router.push(`/lists/${listId}`);
          }}
        >
          {t("backToList")}
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
          <Typography variant="h2">{t("reviewComplete")}</Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {t("youReviewed", {
              count: doneCount,
              unit: doneCount === 1 ? t("word") : t("wordsUnit"),
            })}
          </Typography>
        </Stack>
        <Button
          variant="outlined"
          onClick={() => {
            router.refresh();
            router.push(`/lists/${listId}`);
          }}
        >
          {t("backToList")}
        </Button>
      </Stack>
    );
  }

  return (
    <>
      <Stack spacing={3} sx={{ pb: STUDY_ACTION_BAR_OFFSET }}>
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
                <Typography variant="h1" textAlign="center">
                  {current.source_text}
                </Typography>
              </Stack>

              {current.scene_description && (
                <>
                  <Divider />
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      {t("scene")}
                    </Typography>
                    <Typography variant="body1">
                      {current.scene_description}
                    </Typography>
                  </Stack>
                </>
              )}
              {current.sound_association && (
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    {t("association")}
                  </Typography>
                  <Typography variant="body1">
                    {current.sound_association}
                  </Typography>
                </Stack>
              )}

              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                {t("whatIsThisWord")}
              </Typography>

              {isAnswerVisible && (
                <>
                  <Divider />
                  <Stack alignItems="center" sx={{ py: 1 }}>
                    <Typography variant="h2" color="primary">
                      {current.target_text}
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
      </StudyActionBar>
    </>
  );
}
