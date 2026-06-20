"use client";

import { useRouter } from "next/navigation";
import { CourseForm } from "@/entities/course/ui/CourseForm";
import { updateCourseAction } from "@/entities/course/api/course-actions";
import type { Course } from "@/entities/course";

type EditCourseProps = {
  course: Course;
};

export function EditCourse({ course }: EditCourseProps) {
  const router = useRouter();

  return (
    <CourseForm
      backHref={`/courses/${course.id}`}
      heading="Edit course"
      submitLabel="Save"
      initialTitle={course.title}
      initialDescription={course.description ?? ""}
      onSubmit={async ({ title, description }) => {
        await updateCourseAction(course.id, { title, description });
        router.push(`/courses/${course.id}`);
      }}
    />
  );
}
