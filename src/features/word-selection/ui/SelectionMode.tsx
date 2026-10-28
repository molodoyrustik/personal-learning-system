"use client";

import { Button, Card, CardContent, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { List } from "@/entities/list";
import { commitSelectionResultsAction } from "@/entities/word/api/word-actions";
import type { Word } from "@/entities/word/model/types";
import { STUDY_ACTION_BAR_OFFSET, StudyActionBar } from "@/shared/ui/StudyActionBar";
import { useSessionCommit } from "@/shared/lib/use-session-commit";
import { SessionSaveGate } from "@/shared/ui/SessionSaveGate";

type SelectionModeProps = {
  list: List;
  initialWords: Word[];
};

export function SelectionMode({ list, initialWords }: SelectionModeProps) {
  const t = useTranslations("WordModes");
  const backHref = `/lists/${list.id}`;

  const [queue, setQueue] = useState<Word[]>(() =>
    initialWords.filter((w) => w.status === "new"),
  );
  const [processed, setProcessed] = useState(0);

  // Collected locally for the whole session — flushed to
  // commitSelectionResultsAction only once the queue is fully drained.
  // Quitting early (Back button, closing the tab) never persists anything.
  const resultsRef = useRef<{ wordId: string; decision: "unknown_and_needed" | "already_known" }[]>([]);

  const total = queue.length;
  const current = queue[0] ?? null;
  const isFinished = queue.length === 0;

  // Persist once the whole queue finishes (skip if queue was always empty)
  const save = useSessionCommit(
    () => commitSelectionResultsAction(resultsRef.current),
    processed > 0 && queue.length === 0,
  );

  function handleNeedToLearn() {
    if (!current) return;
    resultsRef.current.push({ wordId: current.id, decision: "unknown_and_needed" });
    setProcessed((n) => n + 1);
    setQueue((q) => q.slice(1));
  }

  function handleAlreadyKnow() {
    if (!current) return;
    resultsRef.current.push({ wordId: current.id, decision: "already_known" });
    setProcessed((n) => n + 1);
    setQueue((q) => q.slice(1));
  }

  function handleSkip() {
    setQueue((q) => [...q.slice(1), q[0]]);
  }

  const encodingHref = `/lists/${list.id}/encoding`;

  if (total === 0 && processed === 0) {
    return (
      <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ minHeight: "60vh" }}>
        <Stack spacing={1} alignItems="center">
          <Typography variant="h2">{t("nothingToSelect")}</Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {t("noNewWords")}
          </Typography>
        </Stack>
        <Button variant="outlined" component={Link} href={backHref}>{t("backToList")}</Button>
      </Stack>
    );
  }

  if (isFinished && processed > 0) {
    return (
      <SessionSaveGate status={save.status} onRetry={save.retry}>
        <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ minHeight: "60vh" }}>
          <Stack spacing={1} alignItems="center">
            <Typography variant="h2">{t("selectionComplete")}</Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              {t("allWordsProcessed")}
            </Typography>
          </Stack>
          <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 320 }}>
            <Button variant="contained" fullWidth component={Link} href={encodingHref}>{t("toEncodingMode")}</Button>
            <Button variant="outlined" fullWidth component={Link} href={backHref}>{t("backToList")}</Button>
          </Stack>
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
      </Stack>

      <StudyActionBar>
        <Stack direction="row" spacing={1}>
          <Button variant="text" fullWidth onClick={handleSkip} color="inherit">
            {t("skip")}
          </Button>
          <Button variant="outlined" fullWidth onClick={handleAlreadyKnow}>
            {t("iKnow")}
          </Button>
          <Button variant="contained" fullWidth onClick={handleNeedToLearn}>
            {t("needToLearn")}
          </Button>
        </Stack>
      </StudyActionBar>
    </>
  );
}
