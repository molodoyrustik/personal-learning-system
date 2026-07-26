import { getSentencesByPatternId } from "@/entities/pattern/api/pattern-api";
import { FirstPassMode } from "@/features/pattern-first-pass";

type FirstPassPageProps = {
  params: Promise<{ patternId: string }>;
  searchParams: Promise<{ lessonId?: string; courseId?: string }>;
};

export default async function FirstPassPage({ params, searchParams }: FirstPassPageProps) {
  const { patternId } = await params;
  const { lessonId, courseId } = await searchParams;
  const sentences = await getSentencesByPatternId(patternId);
  return (
    <FirstPassMode
      patternId={patternId}
      initialSentences={sentences}
      lessonId={lessonId}
      courseId={courseId}
    />
  );
}
