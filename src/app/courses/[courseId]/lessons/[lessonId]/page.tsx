import { notFound } from "next/navigation";
import { getLists } from "@/entities/list/api/list-api";
import { getLessonById } from "@/entities/lesson/api/lesson-api";
import { getPatterns } from "@/entities/pattern/api/pattern-api";
import { LessonDetails } from "@/features/lesson-details";

type LessonPageProps = {
  params: Promise<{ courseId: string; lessonId: string }>;
};

export default async function LessonPage({ params }: LessonPageProps) {
  const { courseId, lessonId } = await params;
  const [lesson, allLists, allPatterns] = await Promise.all([
    getLessonById(lessonId),
    getLists(),
    getPatterns(),
  ]);
  if (!lesson) notFound();
  return (
    <LessonDetails
      courseId={courseId}
      lesson={lesson}
      allLists={allLists}
      allPatterns={allPatterns}
    />
  );
}
