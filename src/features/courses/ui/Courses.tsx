"use client";

import {
  Button,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Course } from "@/entities/course";

type CoursesProps = {
  courses: Course[];
  lessonCounts: Record<string, number>;
};

export function Courses({ courses, lessonCounts }: CoursesProps) {
  const t = useTranslations("Courses");

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h1">{t("title")}</Typography>
          <Link href="/courses/new" style={{ textDecoration: "none" }}>
            <Button variant="contained">{t("createCourse")}</Button>
          </Link>
        </Stack>

        <Stack spacing={2}>
          {courses.length === 0 && (
            <Typography variant="body1" color="text.secondary">
              {t("noCoursesYet")}
            </Typography>
          )}
          {courses.map((course) => {
            const count = lessonCounts[course.id] ?? 0;
            return (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Card>
                  <CardActionArea>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack spacing={0.5}>
                          <Typography variant="h3">{course.title}</Typography>
                          {course.description && (
                            <Typography variant="body2" color="text.secondary">
                              {course.description}
                            </Typography>
                          )}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {count} {count === 1 ? t("lesson") : t("lessons")}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Link>
            );
          })}
        </Stack>
      </Stack>
    </Container>
  );
}
