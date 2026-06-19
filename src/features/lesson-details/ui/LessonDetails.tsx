"use client";

import {
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { List } from "@/entities/list";
import type { Lesson } from "@/entities/lesson";
import type { Pattern } from "@/entities/pattern";
import {
  addWordListToLessonAction,
  removeWordListFromLessonAction,
  addPatternToLessonAction,
  removePatternFromLessonAction,
} from "@/entities/lesson/api/lesson-actions";

type LessonDetailsProps = {
  courseId: string;
  lesson: Lesson;
  allLists: List[];
  allPatterns: Pattern[];
};

export function LessonDetails({ courseId, lesson, allLists, allPatterns }: LessonDetailsProps) {
  const router = useRouter();

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
      <Button
        variant="text"
        onClick={() => router.push(`/courses/${courseId}`)}
        size="small"
        sx={{ alignSelf: "flex-start" }}
      >
        ← Course
      </Button>

      <Stack spacing={0.5}>
        <Typography variant="h1">{lesson.title}</Typography>
        {lesson.description && (
          <Typography variant="body1" color="text.secondary">
            {lesson.description}
          </Typography>
        )}
      </Stack>

      {/* ── Word Lists ─────────────────────────────────────────── */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h3">Word Lists</Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => router.push(`/lists/new?${lessonParams}`)}
                >
                  Create word list
                </Button>
                {availableLists.length > 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowAttachList((v) => !v)}
                  >
                    Attach existing
                  </Button>
                )}
              </Stack>
            </Stack>

            {showAttachList && availableLists.length > 0 && (
              <Stack direction="row" spacing={1} alignItems="center">
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Choose a list</InputLabel>
                  <Select
                    value={selectedList}
                    label="Choose a list"
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
                  Attach
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
                    <Link href={`/lists/${list.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <Typography variant="body1" sx={{ "&:hover": { textDecoration: "underline" } }}>
                        {list.name}
                      </Typography>
                    </Link>
                    <Button size="small" color="error" variant="text" onClick={() => handleRemoveList(list.id)}>
                      Remove
                    </Button>
                  </Stack>
                ))}
              </Stack>
            )}

            {attachedLists.length === 0 && !showAttachList && (
              <Typography variant="body2" color="text.secondary">
                No word lists yet.
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
              <Typography variant="h3">Pattern Lists</Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => router.push(`/patterns/new?${lessonParams}`)}
                >
                  Create pattern list
                </Button>
                {availablePatterns.length > 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowAttachPattern((v) => !v)}
                  >
                    Attach existing
                  </Button>
                )}
              </Stack>
            </Stack>

            {showAttachPattern && availablePatterns.length > 0 && (
              <Stack direction="row" spacing={1} alignItems="center">
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Choose a pattern</InputLabel>
                  <Select
                    value={selectedPattern}
                    label="Choose a pattern"
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
                  Attach
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
                    <Link href={`/patterns/${pattern.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <Typography variant="body1" sx={{ "&:hover": { textDecoration: "underline" } }}>
                        {pattern.name}
                      </Typography>
                    </Link>
                    <Button size="small" color="error" variant="text" onClick={() => handleRemovePattern(pattern.id)}>
                      Remove
                    </Button>
                  </Stack>
                ))}
              </Stack>
            )}

            {attachedPatterns.length === 0 && !showAttachPattern && (
              <Typography variant="body2" color="text.secondary">
                No pattern lists yet.
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
