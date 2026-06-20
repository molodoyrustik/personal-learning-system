"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LessonForm } from "@/entities/lesson/ui/LessonForm";
import { updateLessonAction } from "@/entities/lesson/api/lesson-actions";
import type { Lesson } from "@/entities/lesson";

type EditLessonProps = {
  lesson: Lesson;
};

export function EditLesson({ lesson }: EditLessonProps) {
  const router = useRouter();
  const t = useTranslations("Lessons");
  const tCommon = useTranslations("Common");

  return (
    <LessonForm
      backHref={`/courses/${lesson.courseId}/lessons/${lesson.id}`}
      heading={t("editLessonHeading")}
      submitLabel={tCommon("save")}
      initialTitle={lesson.title}
      initialDescription={lesson.description ?? ""}
      onSubmit={async ({ title, description }) => {
        await updateLessonAction(lesson.id, lesson.courseId, { title, description });
        router.push(`/courses/${lesson.courseId}/lessons/${lesson.id}`);
      }}
    />
  );
}
