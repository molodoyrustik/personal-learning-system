"use client";

import { Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Word } from "@/entities/word/model/types";
import { selectWordAction, rejectWordAction } from "@/entities/word/api/word-actions";

type SelectionModeProps = {
  listId: string;
  initialWords: Word[];
};

export function SelectionMode({ listId, initialWords }: SelectionModeProps) {
  const router = useRouter();
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
          <Typography variant="h2">Nothing to select</Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            There are no new words in this list.
          </Typography>
        </Stack>
        <Button variant="outlined" onClick={goBack}>Back to list</Button>
      </Stack>
    );
  }

  if (isFinished && processed > 0) {
    return (
      <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ minHeight: "60vh" }}>
        <Stack spacing={1} alignItems="center">
          <Typography variant="h2">Selection complete</Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            All new words in this list have been processed.
          </Typography>
        </Stack>
        <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 320 }}>
          <Button variant="contained" fullWidth onClick={goToEncoding}>→ Encoding Mode</Button>
          <Button variant="outlined" fullWidth onClick={goBack}>Back to list</Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button variant="text" size="small" sx={{ px: 0, minHeight: "auto" }} onClick={goBack}>
          ← Back
        </Button>
        <Typography variant="caption" color="text.secondary">
          {processed} / {total} done
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
          Need to learn
        </Button>
        <Button variant="outlined" fullWidth onClick={handleAlreadyKnow}>
          I know
        </Button>
        <Button variant="text" fullWidth onClick={handleSkip} color="inherit">
          Skip
        </Button>
      </Stack>
    </Stack>
  );
}
