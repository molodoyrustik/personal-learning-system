"use client";

import {
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { LanguageCode } from "@/entities/list";
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

// "forward" asks source → target (the direction words were encoded in);
// "reverse" asks target → source. Both feed the same FSRS card.
type Direction = "forward" | "reverse";

type DailyReviewProps = {
  listId: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  initialWords: ReviewWord[];
};

export function DailyReview({
  listId,
  sourceLanguage,
  targetLanguage,
  initialWords,
}: DailyReviewProps) {
  const t = useTranslations("WordModes");
  const tCommon = useTranslations("Common");
  const [direction, setDirection] = useState<Direction | null>(null);
  const [queue, setQueue] = useState<ReviewWord[]>(initialWords);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const total = initialWords.length;
  const current = queue[0] ?? null;
  const isReverse = direction === "reverse";
  const forwardLabel = `${sourceLanguage.toUpperCase()} → ${targetLanguage.toUpperCase()}`;
  const reverseLabel = `${targetLanguage.toUpperCase()} → ${sourceLanguage.toUpperCase()}`;

  function moveToNext() {
    setQueue((q) => q.slice(1));
    setDoneCount((n) => n + 1);
    setIsAnswerVisible(false);
  }

  async function handleRate(rating: ReviewRating) {
    if (!current || isSaving) return;
    setIsSaving(true);
    setSaveFailed(false);
    try {
      await markReviewResultAction(current.id, rating);
      moveToNext();
    } catch (error) {
      // Stay on the same card so the rating can simply be tapped again.
      console.error("Failed to save review rating", error);
      setSaveFailed(true);
    } finally {
      setIsSaving(false);
    }
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
          component={Link}
          href={`/lists/${listId}`}
        >
          {t("backToList")}
        </Button>
      </Stack>
    );
  }

  if (direction === null) {
    return (
      <Stack
        spacing={3}
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: "60vh" }}
      >
        <Stack spacing={1} alignItems="center">
          <Typography variant="h2">{t("dailyReview")}</Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {t("chooseDirection")}
          </Typography>
        </Stack>
        <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 320 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setDirection("forward")}
          >
            {forwardLabel}
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setDirection("reverse")}
          >
            {reverseLabel}
          </Button>
        </Stack>
        <Button variant="text" component={Link} href={`/lists/${listId}`}>
          {t("backToList")}
        </Button>
      </Stack>
    );
  }

  // In reverse the scene and association are built around the target word's
  // sound, so they would give the answer away — reveal them with the answer.
  const prompt = isReverse ? current?.target_text : current?.source_text;
  const answer = isReverse ? current?.source_text : current?.target_text;
  const showHints = !isReverse || isAnswerVisible;

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
          component={Link}
          href={`/lists/${listId}`}
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
            {isReverse ? reverseLabel : forwardLabel} · {doneCount + 1} / {total}
          </Typography>
        </Stack>

        <Card>
          <CardContent>
            <Stack spacing={2.5}>
              <Stack spacing={0.5} alignItems="center">
                <Typography variant="h1" textAlign="center">
                  {prompt}
                </Typography>
              </Stack>

              {showHints && current.scene_description && (
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
              {showHints && current.sound_association && (
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
        {saveFailed && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {tCommon("saveFailed")}
          </Alert>
        )}
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
              disabled={isSaving}
              onClick={() => handleRate(AGAIN)}
            >
              {t("rateAgain")}
            </Button>
            <Button
              variant="outlined"
              color="warning"
              fullWidth
              disabled={isSaving}
              onClick={() => handleRate(HARD)}
            >
              {t("rateHard")}
            </Button>
            <Button
              variant="contained"
              fullWidth
              disabled={isSaving}
              onClick={() => handleRate(GOOD)}
            >
              {t("rateGood")}
            </Button>
            <Button
              variant="outlined"
              color="success"
              fullWidth
              disabled={isSaving}
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
