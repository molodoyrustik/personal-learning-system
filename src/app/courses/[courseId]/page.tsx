import { notFound } from "next/navigation";
import { getCourseById } from "@/entities/course/api/course-api";
import { computeLessonStatus, type LessonProgress } from "@/entities/lesson";
import { getLessonsByCourseId } from "@/entities/lesson/api/lesson-api";
import { getSentenceProgressByPatternIds } from "@/entities/pattern/api/pattern-api";
import { getWordProgressByListIds } from "@/entities/word/api/word-api";
import { CourseDetails } from "@/features/course-details";

type CoursePageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = await params;
  const [course, lessons] = await Promise.all([
    getCourseById(courseId),
    getLessonsByCourseId(courseId),
  ]);
  if (!course) notFound();

  const [wordProgressByListId, sentenceProgressByPatternId] = await Promise.all(
    [
      getWordProgressByListIds(lessons.flatMap((l) => l.wordListIds)),
      getSentenceProgressByPatternIds(lessons.flatMap((l) => l.patternIds)),
    ],
  );

  const lessonProgress: Record<string, LessonProgress> = {};
  for (const lesson of lessons) {
    const wordStats = lesson.wordListIds.reduce(
      (acc, id) => {
        const p = wordProgressByListId[id];
        if (!p) return acc;
        return {
          total: acc.total + p.total,
          newCount: acc.newCount + p.newCount,
          doneCount: acc.doneCount + p.doneCount,
          dueCount: acc.dueCount + p.dueCount,
        };
      },
      { total: 0, newCount: 0, doneCount: 0, dueCount: 0 },
    );
    const sentenceStats = lesson.patternIds.reduce(
      (acc, id) => {
        const p = sentenceProgressByPatternId[id];
        if (!p) return acc;
        return {
          total: acc.total + p.total,
          newCount: acc.newCount + p.newCount,
          doneCount: acc.doneCount + p.doneCount,
        };
      },
      { total: 0, newCount: 0, doneCount: 0 },
    );

    lessonProgress[lesson.id] = {
      status: computeLessonStatus({
        wordTotal: wordStats.total,
        wordNew: wordStats.newCount,
        wordDone: wordStats.doneCount,
        sentenceTotal: sentenceStats.total,
        sentenceNew: sentenceStats.newCount,
        sentenceDone: sentenceStats.doneCount,
      }),
      dueCount: wordStats.dueCount,
    };
  }

  return (
    <CourseDetails
      course={course}
      lessons={lessons}
      lessonProgress={lessonProgress}
    />
  );
}
