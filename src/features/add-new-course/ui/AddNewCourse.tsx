"use client";

import { useRouter } from "next/navigation";
import { CourseForm } from "@/entities/course/ui/CourseForm";
import { createCourseAction } from "@/entities/course/api/course-actions";

export function AddNewCourse() {
  const router = useRouter();

  return (
    <CourseForm
      backHref="/courses"
      heading="New course"
      submitLabel="Create course"
      onSubmit={async ({ title, description }) => {
        const { courseId } = await createCourseAction({ title, description });
        router.push(`/courses/${courseId}`);
      }}
    />
  );
}
