"use client";

import {
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Course } from "@/entities/course";
import type { Lesson } from "@/entities/lesson";
import { deleteCourseAction } from "@/entities/course/api/course-actions";
import { createLessonAction, deleteLessonAction } from "@/entities/lesson/api/lesson-actions";

type CourseDetailsProps = {
  course: Course;
  lessons: Lesson[];
};

export function CourseDetails({ course, lessons }: CourseDetailsProps) {
  const router = useRouter();
  const [addingLesson, setAddingLesson] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");

  async function handleAddLesson() {
    const t = lessonTitle.trim();
    if (!t) return;
    await createLessonAction({ courseId: course.id, title: t });
    setLessonTitle("");
    setAddingLesson(false);
    router.refresh();
  }

  async function handleDeleteLesson(lessonId: string) {
    await deleteLessonAction(lessonId, course.id);
    router.refresh();
  }

  async function handleDeleteCourse() {
    await deleteCourseAction(course.id);
    router.push("/courses");
  }

  return (
    <Stack spacing={3}>
      <Button
        variant="text"
        onClick={() => router.push("/courses")}
        size="small"
        sx={{ alignSelf: "flex-start" }}
      >
        ← Courses
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
        <Button size="small" color="error" variant="outlined" onClick={handleDeleteCourse}>
          Delete course
        </Button>
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h2">Lessons</Typography>
        {!addingLesson && (
          <Button variant="contained" size="small" onClick={() => setAddingLesson(true)}>
            Add lesson
          </Button>
        )}
      </Stack>

      {addingLesson && (
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="Lesson title"
                size="small"
                fullWidth
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddLesson()}
                autoFocus
              />
              <Button variant="contained" onClick={handleAddLesson} disabled={!lessonTitle.trim()}>
                Save
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  setAddingLesson(false);
                  setLessonTitle("");
                }}
              >
                Cancel
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Stack spacing={1.5}>
        {lessons.length === 0 && !addingLesson && (
          <Typography variant="body1" color="text.secondary">
            No lessons yet. Add the first one.
          </Typography>
        )}
        {lessons.map((lesson, idx) => (
          <Card key={lesson.id}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Link
                  href={`/courses/${course.id}/lessons/${lesson.id}`}
                  style={{ textDecoration: "none", color: "inherit", flex: 1 }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 24 }}>
                      {idx + 1}.
                    </Typography>
                    <Typography variant="h3">{lesson.title}</Typography>
                  </Stack>
                </Link>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteLesson(lesson.id)}
                  aria-label="Delete lesson"
                >
                  ✕
                </IconButton>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
