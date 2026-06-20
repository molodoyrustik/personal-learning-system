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
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { Course } from "@/entities/course";
import type { Lesson } from "@/entities/lesson";
import { deleteCourseAction } from "@/entities/course/api/course-actions";
import { createLessonAction } from "@/entities/lesson/api/lesson-actions";

type CourseDetailsProps = {
  course: Course;
  lessons: Lesson[];
};

export function CourseDetails({ course, lessons }: CourseDetailsProps) {
  const router = useRouter();
  const t = useTranslations("Courses");
  const tCommon = useTranslations("Common");

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
          <Button color="error" onClick={handleDeleteConfirm} disabled={isPending}>
            {isPending ? tCommon("deleting") : tCommon("delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add lesson dialog */}
      <Dialog open={addLessonOpen} onClose={handleAddLessonClose} fullWidth maxWidth="xs">
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

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
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
          <MenuItem onClick={() => { closeMenu(); setAddLessonOpen(true); }}>
            {t("addLesson")}
          </MenuItem>
          <MenuItem component={Link} href={`/courses/${course.id}/edit`} onClick={closeMenu}>
            {tCommon("edit")}
          </MenuItem>
          <MenuItem onClick={() => { closeMenu(); setDeleteOpen(true); }} sx={{ color: "error.main" }}>
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
        {lessons.map((lesson, idx) => (
          <Card key={lesson.id}>
            <CardContent>
              <Link
                href={`/courses/${course.id}/lessons/${lesson.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 24 }}>
                    {idx + 1}.
                  </Typography>
                  <Typography variant="h3">{lesson.title}</Typography>
                </Stack>
              </Link>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
