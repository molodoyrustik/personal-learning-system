"use client";

import { useRouter } from "next/navigation";
import { LessonForm } from "@/entities/lesson/ui/LessonForm";
import { updateLessonAction } from "@/entities/lesson/api/lesson-actions";
import type { Lesson } from "@/entities/lesson";

type EditLessonProps = {
  lesson: Lesson;
};

export function EditLesson({ lesson }: EditLessonProps) {
  const router = useRouter();

  return (
    <LessonForm
      backHref={`/courses/${lesson.courseId}/lessons/${lesson.id}`}
      heading="Edit lesson"
      submitLabel="Save"
      initialTitle={lesson.title}
      initialDescription={lesson.description ?? ""}
      onSubmit={async ({ title, description }) => {
        await updateLessonAction(lesson.id, lesson.courseId, { title, description });
        router.push(`/courses/${lesson.courseId}/lessons/${lesson.id}`);
      }}
    />
  );
}
