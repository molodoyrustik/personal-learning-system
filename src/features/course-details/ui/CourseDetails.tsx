"use client";

import MoreVertIcon from "@mui/icons-material/MoreVert";
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
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { Course } from "@/entities/course";
import { deleteCourseAction } from "@/entities/course/api/course-actions";
import type { Lesson, LessonProgress, LessonStatus } from "@/entities/lesson";
import { createLessonAction } from "@/entities/lesson/api/lesson-actions";

const STATUS_COLORS: Record<LessonStatus, "default" | "warning" | "success"> = {
  todo: "default",
  "in-progress": "warning",
  done: "success",
};

type CourseDetailsProps = {
  course: Course;
  lessons: Lesson[];
  lessonProgress: Record<string, LessonProgress>;
};

export function CourseDetails({
  course,
  lessons,
  lessonProgress,
}: CourseDetailsProps) {
  const router = useRouter();
  const t = useTranslations("Courses");
  const tCommon = useTranslations("Common");

  const STATUS_LABELS: Record<LessonStatus, string> = {
    todo: t("statusTodo"),
    "in-progress": t("statusInProgress"),
    done: t("statusDone"),
  };

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const closeMenu = () => setMenuAnchor(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonPending, setLessonPending] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleAddLesson() {
    const title = lessonTitle.trim();
    if (!title || lessonPending) return;
    setLessonPending(true);
    try {
      await createLessonAction({ courseId: course.id, title });
      setLessonTitle("");
      setAddLessonOpen(false);
      router.refresh();
    } finally {
      setLessonPending(false);
    }
  }

  function handleAddLessonClose() {
    setLessonTitle("");
    setAddLessonOpen(false);
  }

  function handleDeleteConfirm() {
    startTransition(async () => {
      await deleteCourseAction(course.id);
      router.push("/courses");
    });
  }

  return (
    <Stack spacing={3}>
      {/* Delete course dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>{t("deleteTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("deleteMessage", { title: course.title })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={isPending}>
            {tCommon("cancel")}
          </Button>
          <Button
            color="error"
            onClick={handleDeleteConfirm}
            disabled={isPending}
          >
            {isPending ? tCommon("deleting") : tCommon("delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add lesson dialog */}
      <Dialog
        open={addLessonOpen}
        onClose={handleAddLessonClose}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("addLesson")}</DialogTitle>
        <DialogContent>
          <TextField
            label={t("lessonTitleLabel")}
            fullWidth
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddLesson()}
            autoFocus
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddLessonClose}>{tCommon("cancel")}</Button>
          <Button
            variant="contained"
            onClick={handleAddLesson}
            disabled={!lessonTitle.trim() || lessonPending}
          >
            {lessonPending ? tCommon("creating") : tCommon("add")}
          </Button>
        </DialogActions>
      </Dialog>

      <Button
        variant="text"
        onClick={() => router.push("/courses")}
        size="small"
        sx={{ alignSelf: "flex-start" }}
      >
        {t("backToCourses")}
      </Button>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Stack spacing={0.5}>
          <Typography variant="h1">{course.title}</Typography>
          {course.description && (
            <Typography variant="body1" color="text.secondary">
              {course.description}
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
            onClick={() => {
              closeMenu();
              setAddLessonOpen(true);
            }}
          >
            {t("addLesson")}
          </MenuItem>
          <MenuItem
            component={Link}
            href={`/courses/${course.id}/edit`}
            onClick={closeMenu}
          >
            {tCommon("edit")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu();
              setDeleteOpen(true);
            }}
            sx={{ color: "error.main" }}
          >
            {tCommon("delete")}
          </MenuItem>
        </Menu>
      </Stack>

      <Typography variant="h2">{t("lessonsSection")}</Typography>

      <Stack spacing={1.5}>
        {lessons.length === 0 && (
          <Typography variant="body1" color="text.secondary">
            {t("noLessonsYet")}
          </Typography>
        )}
        {lessons.map((lesson, idx) => {
          const progress = lessonProgress[lesson.id] ?? {
            status: "todo" as LessonStatus,
            dueCount: 0,
          };
          return (
            <Card key={lesson.id}>
              <CardContent>
                <Link
                  href={`/courses/${course.id}/lessons/${lesson.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      sx={{ minWidth: 0 }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ minWidth: 24 }}
                      >
                        {idx + 1}.
                      </Typography>
                      <Typography variant="h3" noWrap>
                        {lesson.title}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} flexShrink={0}>
                      <Chip
                        label={STATUS_LABELS[progress.status]}
                        size="small"
                        color={STATUS_COLORS[progress.status]}
                        variant={
                          progress.status === "todo" ? "outlined" : "filled"
                        }
                      />
                      {progress.dueCount > 0 && (
                        <Chip
                          label={t("dueForReview", {
                            count: progress.dueCount,
                          })}
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Stack>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Stack>
  );
}
