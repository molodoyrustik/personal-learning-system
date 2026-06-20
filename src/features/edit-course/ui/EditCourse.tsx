"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CourseForm } from "@/entities/course/ui/CourseForm";
import { updateCourseAction } from "@/entities/course/api/course-actions";
import type { Course } from "@/entities/course";

type EditCourseProps = {
  course: Course;
};

export function EditCourse({ course }: EditCourseProps) {
  const router = useRouter();
  const t = useTranslations("Courses");
  const tCommon = useTranslations("Common");

  return (
    <CourseForm
      backHref={`/courses/${course.id}`}
      heading={t("editCourseHeading")}
      submitLabel={tCommon("save")}
      initialTitle={course.title}
      initialDescription={course.description ?? ""}
      onSubmit={async ({ title, description }) => {
        await updateCourseAction(course.id, { title, description });
        router.push(`/courses/${course.id}`);
      }}
    />
  );
}
