import { getSentencesByPatternId } from "@/entities/pattern/api/pattern-api";
import { ReviewMode } from "@/features/pattern-review";

type ReviewPageProps = {
  params: Promise<{ patternId: string }>;
  searchParams: Promise<{ lessonId?: string; courseId?: string }>;
};

export default async function ReviewPage({ params, searchParams }: ReviewPageProps) {
  const { patternId } = await params;
  const { lessonId, courseId } = await searchParams;
  const sentences = await getSentencesByPatternId(patternId);
  return (
    <ReviewMode
      patternId={patternId}
      initialSentences={sentences}
      lessonId={lessonId}
      courseId={courseId}
    />
  );
}
