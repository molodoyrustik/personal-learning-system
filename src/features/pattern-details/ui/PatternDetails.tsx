"use client";

import {
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { Pattern, PatternRun, PatternSentence, SentenceStatus } from "@/entities/pattern";
import {
  deletePatternAction,
  deleteSentenceAction,
  importSentencesAction,
} from "@/entities/pattern/api/pattern-actions";
import {
  ImportSentencesDrawer,
  type ImportedSentence,
} from "@/features/import-sentences";
import {
  getFirstPassQueue,
  getFullPracticeQueue,
  getMarkedQueue,
} from "@/shared/model/patterns-store";

type PatternDetailsProps = {
  pattern: Pattern;
  sentences: PatternSentence[];
  runs: PatternRun[];
};

const STATUS_LABELS: Record<SentenceStatus, string> = {
  new: "New",
  marked: "Marked",
  learning: "Learning",
};

const STATUS_COLORS: Record<SentenceStatus, "default" | "primary" | "warning" | "success"> = {
  new: "default",
  marked: "warning",
  learning: "success",
};

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m} min ${s}s` : `${m} min`;
}

export function PatternDetails({ pattern, sentences, runs }: PatternDetailsProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const patternId = pattern.id;

  function handleDeleteConfirm() {
    startTransition(() => deletePatternAction(patternId));
  }

  const firstPassCount = useMemo(
    () => getFirstPassQueue(sentences, patternId).length,
    [sentences, patternId],
  );
  const markedCount = useMemo(
    () => getMarkedQueue(sentences, patternId).length,
    [sentences, patternId],
  );
  const fullPracticeCount = useMemo(
    () => getFullPracticeQueue(sentences, patternId).length,
    [sentences, patternId],
  );

  async function handleImport(imported: ImportedSentence[]) {
    await importSentencesAction(
      patternId,
      imported.map(({ sourceText, targetText }) => ({ sourceText, targetText })),
    );
    setDrawerOpen(false);
  }

  const modes = [
    {
      label: "First Pass",
      description: "Process new sentences",
      href: `/patterns/${patternId}/first-pass`,
      count: firstPassCount,
    },
    {
      label: "Review Marked",
      description: "Fix hesitations and mistakes",
      href: `/patterns/${patternId}/review`,
      count: markedCount,
    },
    {
      label: "Full Practice",
      description: "Timed full-set run",
      href: `/patterns/${patternId}/full-practice`,
      count: fullPracticeCount,
    },
  ] as const;

  return (
    <>
      <Stack spacing={0.5}>
        <Link href="/patterns" style={{ textDecoration: "none" }}>
          <Button variant="text" size="small" sx={{ px: 0, minHeight: "auto" }}>
            ← Back to Patterns
          </Button>
        </Link>
        <Typography variant="h1">{pattern.name}</Typography>
        {pattern.description && (
          <Typography variant="body2" color="text.secondary">
            {pattern.description}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          {sentences.length} {sentences.length === 1 ? "sentence" : "sentences"} total
        </Typography>
      </Stack>

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h3">Summary</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {(["new", "marked", "learning"] as SentenceStatus[]).map((status) => {
                const count = sentences.filter((s) => s.status === status).length;
                return (
                  <Chip
                    key={status}
                    label={`${STATUS_LABELS[status]}: ${count}`}
                    size="small"
                    variant={count > 0 ? "filled" : "outlined"}
                    color={count > 0 ? STATUS_COLORS[status] : "default"}
                  />
                );
              })}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h3">Modes</Typography>
            <Stack spacing={1.5}>
              {modes.map(({ label, description, href, count }) => (
                <Link
                  key={href}
                  href={count > 0 ? href : "#"}
                  style={{ textDecoration: "none" }}
                  aria-disabled={count === 0}
                  onClick={(e) => count === 0 && e.preventDefault()}
                >
                  <Button
                    variant="outlined"
                    fullWidth
                    disabled={count === 0}
                    sx={{ justifyContent: "space-between", textAlign: "left" }}
                  >
                    <Stack alignItems="flex-start" spacing={0}>
                      <span>{label}</span>
                      <Typography variant="caption" color="text.secondary" component="span">
                        {description}
                      </Typography>
                    </Stack>
                    <Chip
                      label={count}
                      size="small"
                      color={count > 0 ? "primary" : "default"}
                      sx={{ pointerEvents: "none" }}
                    />
                  </Button>
                </Link>
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {runs.length > 0 && (
        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant="h3">Full Practice history</Typography>
              <Stack spacing={0} divider={<Divider />}>
                {runs.map((run, i) => (
                  <Stack
                    key={run.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ py: 1 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Run {i + 1}
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDuration(run.durationSec)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h3">Sentences</Typography>
              <Button variant="outlined" size="small" onClick={() => setDrawerOpen(true)}>
                + Import
              </Button>
            </Stack>
            {sentences.length === 0 ? (
              <Typography variant="body1" color="text.secondary">
                No sentences yet.
              </Typography>
            ) : (
              <Stack spacing={0} divider={<Divider />}>
                {sentences.map((s) => (
                  <Stack
                    key={s.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    sx={{ py: 1.25 }}
                    gap={2}
                  >
                    <Stack spacing={0.25} sx={{ flex: 1 }}>
                      <Typography variant="body1">{s.sourceText}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {s.targetText}
                      </Typography>
                      {s.comment && (
                        <Typography variant="caption" color="text.secondary">
                          {s.comment}
                        </Typography>
                      )}
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
                      <Chip
                        label={STATUS_LABELS[s.status]}
                        size="small"
                        color={STATUS_COLORS[s.status]}
                        variant="outlined"
                      />
                      <Button
                        size="small"
                        color="error"
                        onClick={() => deleteSentenceAction(s.id, patternId)}
                      >
                        ✕
                      </Button>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h3">Danger zone</Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteOpen(true)}
            >
              Delete pattern
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete pattern?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete &quot;{pattern.name}&quot; and all its sentences. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={isPending}>Cancel</Button>
          <Button color="error" onClick={handleDeleteConfirm} disabled={isPending}>
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <ImportSentencesDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onImport={handleImport}
      />
    </>
  );
}
