"use client";

import { Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Word } from "@/entities/word/model/types";
import { selectWordAction, rejectWordAction } from "@/entities/word/api/word-actions";

type SelectionModeProps = {
  listId: string;
  initialWords: Word[];
};

export function SelectionMode({ listId, initialWords }: SelectionModeProps) {
  const router = useRouter();
  const t = useTranslations("WordModes");
  function goBack() { router.refresh(); router.push(`/lists/${listId}`); }

  const [queue, setQueue] = useState<Word[]>(() =>
    initialWords.filter((w) => w.status === "new"),
  );
  const [processed, setProcessed] = useState(0);

  const total = queue.length;
  const current = queue[0] ?? null;
  const isFinished = queue.length === 0;

  async function handleNeedToLearn() {
    if (!current) return;
    await selectWordAction(current.id);
    setProcessed((n) => n + 1);
    setQueue((q) => q.slice(1));
  }

  async function handleAlreadyKnow() {
    if (!current) return;
    await rejectWordAction(current.id, "already_known");
    setProcessed((n) => n + 1);
    setQueue((q) => q.slice(1));
  }

  function handleSkip() {
    setQueue((q) => [...q.slice(1), q[0]]);
  }

  const goToEncoding = () => { router.refresh(); router.push(`/lists/${listId}/encoding`); };

  if (total === 0 && processed === 0) {
    return (
      <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ minHeight: "60vh" }}>
        <Stack spacing={1} alignItems="center">
          <Typography variant="h2">{t("nothingToSelect")}</Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {t("noNewWords")}
          </Typography>
        </Stack>
        <Button variant="outlined" onClick={goBack}>{t("backToList")}</Button>
      </Stack>
    );
  }

  if (isFinished && processed > 0) {
    return (
      <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ minHeight: "60vh" }}>
        <Stack spacing={1} alignItems="center">
          <Typography variant="h2">{t("selectionComplete")}</Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {t("allWordsProcessed")}
          </Typography>
        </Stack>
        <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 320 }}>
          <Button variant="contained" fullWidth onClick={goToEncoding}>{t("toEncodingMode")}</Button>
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
          {processed} / {total}
        </Typography>
      </Stack>

      <Card>
        <CardContent>
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 160, py: 2 }}>
            <Typography variant="h1" textAlign="center">
              {current?.sourceText ?? "—"}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={1.5}>
        <Button variant="contained" fullWidth onClick={handleNeedToLearn}>
          {t("needToLearn")}
        </Button>
        <Button variant="outlined" fullWidth onClick={handleAlreadyKnow}>
          {t("iKnow")}
        </Button>
        <Button variant="text" fullWidth onClick={handleSkip} color="inherit">
          {t("skip")}
        </Button>
      </Stack>
    </Stack>
  );
}
