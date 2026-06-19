"use client";

import {
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useMemo } from "react";
import type { List } from "@/entities/list";
import type { Word, WordStatus } from "@/entities/word/model/types";
import {
  isInDictionaryQueue,
  isInEncodingQueue,
  isInSkippedQueue,
} from "@/shared/model/app-store";

type ListDetailsProps = {
  list: List;
  words: Word[];
};

const STATUS_LABELS: Record<WordStatus, string> = {
  new: "New",
  selected: "Selected",
  rejected: "Rejected",
  skipped: "Skipped",
  encoded: "Encoded",
  learning: "Learning",
  weak: "Weak",
  mastered: "Mastered",
};

const STATUS_COLORS: Record<
  WordStatus,
  "default" | "primary" | "secondary" | "success" | "error" | "warning" | "info"
> = {
  new: "default",
  selected: "primary",
  rejected: "error",
  skipped: "warning",
  encoded: "info",
  learning: "secondary",
  weak: "warning",
  mastered: "success",
};

export function ListDetails({ list, words }: ListDetailsProps) {
  const selectionQueue = useMemo(() => words.filter((w) => w.status === "new"), [words]);
  const encodingQueue = useMemo(() => words.filter(isInEncodingQueue), [words]);
  const skippedQueue = useMemo(() => words.filter(isInSkippedQueue), [words]);
  const dictionaryQueue = useMemo(() => words.filter(isInDictionaryQueue), [words]);
  const recallQueue = useMemo(
    () => words.filter((w) => w.status === "encoded" || w.status === "learning" || w.status === "weak"),
    [words],
  );

  const statusGroups = [
    { label: "New", count: words.filter((w) => w.status === "new").length },
    { label: "Selected", count: words.filter((w) => w.status === "selected").length },
    { label: "Encoded", count: words.filter((w) => w.status === "encoded").length },
    { label: "Skipped", count: words.filter((w) => w.status === "skipped").length },
    { label: "Learning", count: words.filter((w) => w.status === "learning").length },
    { label: "Weak", count: words.filter((w) => w.status === "weak").length },
    { label: "Mastered", count: words.filter((w) => w.status === "mastered").length },
    { label: "Dictionary", count: dictionaryQueue.length },
  ];

  const modes = [
    { label: "Selection Mode", href: "selection", count: selectionQueue.length, active: selectionQueue.length > 0 },
    { label: "Encoding Mode", href: "encoding", count: encodingQueue.length, active: encodingQueue.length > 0 },
    { label: "Skipped Mode", href: "skipped", count: skippedQueue.length, active: skippedQueue.length > 0 },
    { label: "Dictionary Queue", href: "dictionary", count: dictionaryQueue.length, active: dictionaryQueue.length > 0 },
    { label: "Recall Mode", href: "recall", count: recallQueue.length, active: recallQueue.length > 0 },
  ] as const;

  return (
    <>
      <Stack spacing={0.5}>
        <Link href="/lists" style={{ textDecoration: "none" }}>
          <Button variant="text" size="small" sx={{ px: 0, minHeight: "auto" }}>
            ← Back to Lists
          </Button>
        </Link>
        <Typography variant="h1">{list.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {list.sourceLanguage} → {list.targetLanguage}
        </Typography>
        {list.description && (
          <Typography variant="body2" color="text.secondary">
            {list.description}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          {words.length} {words.length === 1 ? "word" : "words"} total
        </Typography>
      </Stack>

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h3">Summary</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {statusGroups.map(({ label, count }) => (
                <Chip
                  key={label}
                  label={`${label}: ${count}`}
                  size="small"
                  variant={count > 0 ? "filled" : "outlined"}
                  color={count > 0 ? "primary" : "default"}
                />
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h3">Modes</Typography>
            <Stack spacing={1.5}>
              {modes.map(({ label, href, count, active }) => (
                <Link
                  key={href}
                  href={`/lists/${list.id}/${href}`}
                  style={{ textDecoration: "none" }}
                  aria-disabled={!active}
                  onClick={(e) => !active && e.preventDefault()}
                >
                  <Button
                    variant="outlined"
                    fullWidth
                    disabled={!active}
                    sx={{ justifyContent: "space-between" }}
                  >
                    <span>{label}</span>
                    <Chip
                      label={count}
                      size="small"
                      color={active ? "primary" : "default"}
                      sx={{ pointerEvents: "none" }}
                    />
                  </Button>
                </Link>
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h3">Words</Typography>
            <Typography variant="caption" color="text.secondary">
              This list is read-only. To add new words, create a new list.
            </Typography>
            {words.length === 0 ? (
              <Typography variant="body1" color="text.secondary">
                No words in this list.
              </Typography>
            ) : (
              <Stack spacing={0} divider={<Divider />}>
                {words.map((word) => (
                  <Stack
                    key={word.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ py: 1.25 }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="body1">{word.sourceText}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {word.targetText}
                      </Typography>
                    </Stack>
                    <Chip
                      label={STATUS_LABELS[word.status]}
                      size="small"
                      color={STATUS_COLORS[word.status]}
                      variant="outlined"
                    />
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
