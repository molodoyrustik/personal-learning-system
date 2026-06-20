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
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
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
  lessonHref?: string;
};

// STATUS_LABELS built dynamically inside the component using t()

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

export function PatternDetails({ pattern, sentences, runs, lessonHref }: PatternDetailsProps) {
  const t = useTranslations("Patterns");
  const tCommon = useTranslations("Common");

  const STATUS_LABELS: Record<SentenceStatus, string> = {
    new: t("statusNew"),
    marked: t("statusMarked"),
    learning: t("statusLearning"),
  };

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const closeMenu = () => setMenuAnchor(null);
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
      label: t("firstPass"),
      description: t("firstPassDescription"),
      href: `/patterns/${patternId}/first-pass`,
      count: firstPassCount,
    },
    {
      label: t("reviewMarked"),
      description: t("reviewMarkedDescription"),
      href: `/patterns/${patternId}/review`,
      count: markedCount,
    },
    {
      label: t("fullPractice"),
      description: t("fullPracticeDescription"),
      href: `/patterns/${patternId}/full-practice`,
      count: fullPracticeCount,
    },
  ] as const;

  return (
    <>
      <Stack spacing={0.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Link href={lessonHref ?? "/patterns"} style={{ textDecoration: "none" }}>
            <Button variant="text" size="small" sx={{ px: 0, minHeight: "auto" }}>
              {lessonHref ? t("backToLesson") : t("backToPatterns")}
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
            <MenuItem component={Link} href={`/patterns/${patternId}/edit`} onClick={closeMenu}>
              {tCommon("edit")}
            </MenuItem>
            <MenuItem onClick={() => { closeMenu(); setDeleteOpen(true); }} sx={{ color: "error.main" }}>
              {tCommon("delete")}
            </MenuItem>
          </Menu>
        </Stack>
        <Typography variant="h1">{pattern.name}</Typography>
        {pattern.description && (
          <Typography variant="body2" color="text.secondary">
            {pattern.description}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          {sentences.length} {sentences.length === 1 ? t("sentence") : t("sentences")}
        </Typography>
      </Stack>

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h3">{t("summary")}</Typography>
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
            <Typography variant="h3">{t("modes")}</Typography>
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
              <Typography variant="h3">{t("fullPracticeHistory")}</Typography>
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
              <Typography variant="h3">{t("sentencesSection")}</Typography>
              <Button variant="outlined" size="small" onClick={() => setDrawerOpen(true)}>
                {t("importSentences")}
              </Button>
            </Stack>
            {sentences.length === 0 ? (
              <Typography variant="body1" color="text.secondary">
                {t("noSentencesYet")}
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
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deleteSentenceAction(s.id, patternId)}
                        aria-label="Delete sentence"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>{t("deleteTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("deleteMessage", { name: pattern.name })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={isPending}>{tCommon("cancel")}</Button>
          <Button color="error" onClick={handleDeleteConfirm} disabled={isPending}>
            {isPending ? tCommon("deleting") : tCommon("delete")}
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
