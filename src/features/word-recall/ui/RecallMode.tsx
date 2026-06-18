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
import type { Word } from "@/entities/word/model/types";
import { markRecallResultAction } from "@/entities/word/api/word-actions";

type RecallModeProps = {
  listId: string;
  initialWords: Word[];
};

const RECALL_STATUSES = ["encoded", "learning", "weak"] as const;

export function RecallMode({ listId, initialWords }: RecallModeProps) {
  const [queue, setQueue] = useState<Word[]>(() =>
    initialWords.filter((w) =>
      (RECALL_STATUSES as readonly string[]).includes(w.status),
    ),
  );
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

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
    moveToNext();
  }

  async function handleForgot() {
    if (!current) return;
    await markRecallResultAction(current.id, false);
    moveToNext();
  }

  if (total === 0) {
    return (
      <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ minHeight: "60vh" }}>
        <Stack spacing={1} alignItems="center">
          <Typography variant="h2">Nothing to recall</Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            There are no words ready for review in this list.
          </Typography>
        </Stack>
        <Button variant="outlined" onClick={goBack}>Back to list</Button>
      </Stack>
    );
  }

  if (!current) {
    return (
      <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ minHeight: "60vh" }}>
        <Stack spacing={1} alignItems="center">
          <Typography variant="h2">Recall complete</Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            All review words have been processed.
          </Typography>
        </Stack>
        <Button variant="outlined" onClick={goBack}>Back to list</Button>
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
            </Stack>
            {current.sceneDescription && (
              <>
                <Divider />
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">Сцена</Typography>
                  <Typography variant="body1">{current.sceneDescription}</Typography>
                </Stack>
              </>
            )}
            {current.soundAssociation && (
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">Ассоциация</Typography>
                <Typography variant="body1">{current.soundAssociation}</Typography>
              </Stack>
            )}
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Какое это слово?
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
          Show Answer
        </Button>
      ) : (
        <Stack spacing={1.5}>
          <Button variant="contained" fullWidth onClick={handleRemembered}>
            Remembered
          </Button>
          <Button variant="outlined" fullWidth onClick={handleForgot}>
            Didn't remember
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
