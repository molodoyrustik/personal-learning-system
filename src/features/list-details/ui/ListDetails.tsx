"use client";

import {
  Box,
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
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { List } from "@/entities/list";
import type { Word, WordStatus } from "@/entities/word/model/types";
import {
  isInSlowEncodeQueue,
  isInEncodingQueue,
  isInSkippedQueue,
} from "@/shared/model/app-store";
import { deleteListAction } from "../actions";

type ListDetailsProps = {
  list: List;
  words: Word[];
  reviewCount: number;
  lessonHref?: string;
};

// STATUS_LABELS is built dynamically inside the component using t()

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
  memorized: "success",
  reviewing: "success",
  known: "success",
};

export function ListDetails({ list, words, reviewCount, lessonHref }: ListDetailsProps) {
  const t = useTranslations("Lists");
  const tCommon = useTranslations("Common");

  const STATUS_LABELS: Record<WordStatus, string> = {
    new: t("statusNew"),
    selected: t("statusSelected"),
    rejected: t("statusSkipped"),
    skipped: t("statusSkipped"),
    encoded: t("statusEncoded"),
    learning: t("statusLearning"),
    weak: t("statusWeak"),
    memorized: t("statusMemorized"),
    reviewing: t("statusReviewing"),
    known: t("statusKnown"),
  };

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const closeMenu = () => setMenuAnchor(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDeleteConfirm() {
    startTransition(() => deleteListAction(list.id));
  }

  const selectionQueue = useMemo(() => words.filter((w) => w.status === "new"), [words]);
  const encodingQueue = useMemo(() => words.filter(isInEncodingQueue), [words]);
  const skippedQueue = useMemo(() => words.filter(isInSkippedQueue), [words]);
  const slowEncodeQueue = useMemo(() => words.filter(isInSlowEncodeQueue), [words]);
  const recallQueue = useMemo(
    () => words.filter((w) => w.status === "encoded" || w.status === "learning" || w.status === "weak"),
    [words],
  );

  const recallRounds = useMemo(
    () => Array.from({ length: 6 }, (_, i) => recallQueue.filter((w) => w.recallSuccessCount === i).length),
    [recallQueue],
  );

  const statusGroups = [
    { label: t("statusNew"), count: words.filter((w) => w.status === "new").length },
    { label: t("statusSelected"), count: words.filter((w) => w.status === "selected").length },
    { label: t("statusEncoded"), count: words.filter((w) => w.status === "encoded").length },
    { label: t("statusSkipped"), count: words.filter((w) => w.status === "skipped").length },
    { label: t("statusLearning"), count: words.filter((w) => w.status === "learning").length },
    { label: t("statusWeak"), count: words.filter((w) => w.status === "weak").length },
    { label: t("statusMemorized"), count: words.filter((w) => w.status === "memorized").length },
    { label: t("statusReviewing"), count: words.filter((w) => w.status === "reviewing").length },
    { label: t("statusKnown"), count: words.filter((w) => w.status === "known").length },
    { label: t("statusSlowEncode"), count: slowEncodeQueue.length },
  ];

  const modes = [
    { label: t("selectionMode"), href: "selection", count: selectionQueue.length, active: selectionQueue.length > 0, detail: null },
    { label: t("encodingMode"), href: "encoding", count: encodingQueue.length, active: encodingQueue.length > 0, detail: null },
    { label: t("skippedMode"), href: "skipped", count: skippedQueue.length, active: skippedQueue.length > 0, detail: null },
    { label: t("slowEncode"), href: "slow-encode", count: slowEncodeQueue.length, active: slowEncodeQueue.length > 0, detail: null },
    {
      label: t("recallMode"),
      href: "recall",
      count: recallQueue.length,
      active: recallQueue.length > 0,
      detail: recallQueue.length > 0
        ? recallRounds.map((n, i) => `${([t("round1"), t("round2"), t("round3"), t("round4"), t("round5"), t("round6")])[i]}: ${n}`).filter((_, i) => recallRounds[i] > 0).join(" · ") || null
        : null,
    },
    { label: t("review"), href: "review", count: reviewCount, active: reviewCount > 0, detail: null },
  ];

  return (
    <>
      <Stack spacing={0.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Link href={lessonHref ?? "/lists"} style={{ textDecoration: "none" }}>
            <Button variant="text" size="small" sx={{ px: 0, minHeight: "auto" }}>
              {lessonHref ? t("backToLesson") : t("backToLists")}
            </Button>
          </Link>
          <IconButton
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            aria-label="More actions"
            sx={{ color: "text.secondary" }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={closeMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem component={Link} href={`/lists/${list.id}/edit`} onClick={closeMenu}>
              {tCommon("edit")}
            </MenuItem>
            <MenuItem onClick={() => { closeMenu(); setDeleteOpen(true); }} sx={{ color: "error.main" }}>
              {tCommon("delete")}
            </MenuItem>
          </Menu>
        </Stack>

        <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
          <DialogTitle>{t("deleteTitle")}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {t("deleteMessage", { name: list.name })}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteOpen(false)} disabled={isPending}>{tCommon("cancel")}</Button>
            <Button color="error" onClick={handleDeleteConfirm} disabled={isPending}>
              {isPending ? tCommon("deleting") : tCommon("delete")}
            </Button>
          </DialogActions>
        </Dialog>
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
          {words.length} {t("words")}
        </Typography>
      </Stack>

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h3">{t("summary")}</Typography>
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
            <Typography variant="h3">{t("modes")}</Typography>
            <Stack spacing={1.5}>
              {modes.map(({ label, href, count, active, detail }) => (
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
                    sx={{ justifyContent: "space-between", alignItems: "center" }}
                  >
                    <Box component="span" sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <span>{label}</span>
                      {detail && (
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, display: "block" }}>
                          {detail}
                        </Typography>
                      )}
                    </Box>
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
            <Typography variant="h3">{t("wordsSection")}</Typography>
            <Typography variant="caption" color="text.secondary">
              {t("readOnly")}
            </Typography>
            {words.length === 0 ? (
              <Typography variant="body1" color="text.secondary">
                {t("noWords")}
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
