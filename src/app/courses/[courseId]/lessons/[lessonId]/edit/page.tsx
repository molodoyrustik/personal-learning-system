import { notFound } from "next/navigation";
import { getLessonById } from "@/entities/lesson/api/lesson-api";
import { EditLesson } from "@/features/edit-lesson/ui/EditLesson";

type EditLessonPageProps = {
  params: Promise<{ courseId: string; lessonId: string }>;
};

export default async function EditLessonPage({ params }: EditLessonPageProps) {
  const { lessonId } = await params;
  const lesson = await getLessonById(lessonId);
  if (!lesson) notFound();
  return <EditLesson lesson={lesson} />;
}
