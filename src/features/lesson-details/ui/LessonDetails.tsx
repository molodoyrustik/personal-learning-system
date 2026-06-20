"use client";

import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { List } from "@/entities/list";
import type { Lesson } from "@/entities/lesson";
import type { Pattern } from "@/entities/pattern";
import {
  addWordListToLessonAction,
  removeWordListFromLessonAction,
  addPatternToLessonAction,
  removePatternFromLessonAction,
  deleteLessonAction,
} from "@/entities/lesson/api/lesson-actions";

type LessonDetailsProps = {
  courseId: string;
  lesson: Lesson;
  allLists: List[];
  allPatterns: Pattern[];
};

export function LessonDetails({ courseId, lesson, allLists, allPatterns }: LessonDetailsProps) {
  const router = useRouter();
  const t = useTranslations("Lessons");
  const tCommon = useTranslations("Common");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const closeMenu = () => setMenuAnchor(null);
  const [listsMenuAnchor, setListsMenuAnchor] = useState<null | HTMLElement>(null);
  const closeListsMenu = () => setListsMenuAnchor(null);
  const [patternsMenuAnchor, setPatternsMenuAnchor] = useState<null | HTMLElement>(null);
  const closePatternsMenu = () => setPatternsMenuAnchor(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDeleteConfirm() {
    startTransition(async () => {
      await deleteLessonAction(lesson.id, courseId);
      router.push(`/courses/${courseId}`);
    });
  }

  const [showAttachList, setShowAttachList] = useState(false);
  const [selectedList, setSelectedList] = useState("");
  const [showAttachPattern, setShowAttachPattern] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState("");

  const { wordListIds, patternIds } = lesson;

  const attachedLists = allLists.filter((l) => wordListIds.includes(l.id));
  const availableLists = allLists.filter((l) => !wordListIds.includes(l.id));
  const attachedPatterns = allPatterns.filter((p) => patternIds.includes(p.id));
  const availablePatterns = allPatterns.filter((p) => !patternIds.includes(p.id));

  async function handleAttachList() {
    if (!selectedList) return;
    await addWordListToLessonAction(lesson.id, selectedList, courseId);
    setSelectedList("");
    setShowAttachList(false);
    router.refresh();
  }

  async function handleRemoveList(listId: string) {
    await removeWordListFromLessonAction(lesson.id, listId, courseId);
    router.refresh();
  }

  async function handleAttachPattern() {
    if (!selectedPattern) return;
    await addPatternToLessonAction(lesson.id, selectedPattern, courseId);
    setSelectedPattern("");
    setShowAttachPattern(false);
    router.refresh();
  }

  async function handleRemovePattern(patternId: string) {
    await removePatternFromLessonAction(lesson.id, patternId, courseId);
    router.refresh();
  }

  const lessonParams = `lessonId=${lesson.id}&courseId=${courseId}`;

  return (
    <Stack spacing={3}>
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>{t("deleteTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("deleteMessage", { title: lesson.title })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={isPending}>{tCommon("cancel")}</Button>
          <Button color="error" onClick={handleDeleteConfirm} disabled={isPending}>
            {isPending ? tCommon("deleting") : t("deleteLesson")}
          </Button>
        </DialogActions>
      </Dialog>

      <Button
        variant="text"
        onClick={() => router.push(`/courses/${courseId}`)}
        size="small"
        sx={{ alignSelf: "flex-start" }}
      >
        {t("backToCourse")}
      </Button>

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Stack spacing={0.5}>
          <Typography variant="h1">{lesson.title}</Typography>
          {lesson.description && (
            <Typography variant="body1" color="text.secondary">
              {lesson.description}
            </Typography>
          )}
        </Stack>
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
          <MenuItem
            component={Link}
            href={`/courses/${courseId}/lessons/${lesson.id}/edit`}
            onClick={closeMenu}
          >
            {tCommon("edit")}
          </MenuItem>
          <MenuItem
            onClick={() => { closeMenu(); setDeleteOpen(true); }}
            sx={{ color: "error.main" }}
          >
            {t("deleteLesson")}
          </MenuItem>
        </Menu>
      </Stack>

      {/* ── Word Lists ─────────────────────────────────────────── */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h3">{t("wordLists")}</Typography>
              <IconButton
                size="small"
                onClick={(e) => setListsMenuAnchor(e.currentTarget)}
                sx={{ color: "text.secondary" }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={listsMenuAnchor}
                open={Boolean(listsMenuAnchor)}
                onClose={closeListsMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem onClick={() => { closeListsMenu(); router.push(`/lists/new?${lessonParams}`); }}>
                  {t("createWordList")}
                </MenuItem>
                {availableLists.length > 0 && (
                  <MenuItem onClick={() => { closeListsMenu(); setShowAttachList((v) => !v); }}>
                    {t("attachExisting")}
                  </MenuItem>
                )}
              </Menu>
            </Stack>

            {showAttachList && availableLists.length > 0 && (
              <Stack direction="row" spacing={1} alignItems="center">
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>{t("chooseList")}</InputLabel>
                  <Select
                    value={selectedList}
                    label={t("chooseList")}
                    onChange={(e) => setSelectedList(e.target.value)}
                  >
                    {availableLists.map((l) => (
                      <MenuItem key={l.id} value={l.id}>
                        {l.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAttachList}
                  disabled={!selectedList}
                >
                  {t("attach")}
                </Button>
              </Stack>
            )}

            {attachedLists.length > 0 && (
              <Stack spacing={0} divider={<Divider />}>
                {attachedLists.map((list) => (
                  <Stack
                    key={list.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ py: 1 }}
                  >
                    <Link href={`/lists/${list.id}?${lessonParams}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <Typography variant="body1" sx={{ "&:hover": { textDecoration: "underline" } }}>
                        {list.name}
                      </Typography>
                    </Link>
                    <Button size="small" color="error" variant="text" onClick={() => handleRemoveList(list.id)}>
                      {tCommon("remove")}
                    </Button>
                  </Stack>
                ))}
              </Stack>
            )}

            {attachedLists.length === 0 && !showAttachList && (
              <Typography variant="body2" color="text.secondary">
                {t("noWordListsYet")}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* ── Pattern Lists ──────────────────────────────────────── */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h3">{t("patternLists")}</Typography>
              <IconButton
                size="small"
                onClick={(e) => setPatternsMenuAnchor(e.currentTarget)}
                sx={{ color: "text.secondary" }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={patternsMenuAnchor}
                open={Boolean(patternsMenuAnchor)}
                onClose={closePatternsMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem onClick={() => { closePatternsMenu(); router.push(`/patterns/new?${lessonParams}`); }}>
                  {t("createPatternList")}
                </MenuItem>
                {availablePatterns.length > 0 && (
                  <MenuItem onClick={() => { closePatternsMenu(); setShowAttachPattern((v) => !v); }}>
                    {t("attachExisting")}
                  </MenuItem>
                )}
              </Menu>
            </Stack>

            {showAttachPattern && availablePatterns.length > 0 && (
              <Stack direction="row" spacing={1} alignItems="center">
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>{t("choosePattern")}</InputLabel>
                  <Select
                    value={selectedPattern}
                    label={t("choosePattern")}
                    onChange={(e) => setSelectedPattern(e.target.value)}
                  >
                    {availablePatterns.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAttachPattern}
                  disabled={!selectedPattern}
                >
                  {t("attach")}
                </Button>
              </Stack>
            )}

            {attachedPatterns.length > 0 && (
              <Stack spacing={0} divider={<Divider />}>
                {attachedPatterns.map((pattern) => (
                  <Stack
                    key={pattern.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ py: 1 }}
                  >
                    <Link href={`/patterns/${pattern.id}?${lessonParams}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <Typography variant="body1" sx={{ "&:hover": { textDecoration: "underline" } }}>
                        {pattern.name}
                      </Typography>
                    </Link>
                    <Button size="small" color="error" variant="text" onClick={() => handleRemovePattern(pattern.id)}>
                      {tCommon("remove")}
                    </Button>
                  </Stack>
                ))}
              </Stack>
            )}

            {attachedPatterns.length === 0 && !showAttachPattern && (
              <Typography variant="body2" color="text.secondary">
                {t("noPatternListsYet")}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
