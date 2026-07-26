import { getSentencesByPatternId } from "@/entities/pattern/api/pattern-api";
import { FullPracticeMode } from "@/features/pattern-full-practice";

type FullPracticePageProps = {
  params: Promise<{ patternId: string }>;
  searchParams: Promise<{ lessonId?: string; courseId?: string }>;
};

export default async function FullPracticePage({ params, searchParams }: FullPracticePageProps) {
  const { patternId } = await params;
  const { lessonId, courseId } = await searchParams;
  const sentences = await getSentencesByPatternId(patternId);
  return (
    <FullPracticeMode
      patternId={patternId}
      initialSentences={sentences}
      lessonId={lessonId}
      courseId={courseId}
    />
  );
}
